import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { createStripeTestDouble } from "../mocks/stripe-strict"

// The strict double of Stripe: it rejects a transfer whose source is not a
// charge, a wrong currency or a wrong amount.
const stripeDouble = createStripeTestDouble()

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: "user_test", email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", async () => {
    const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe")
    return {
        ...actual,
        // The signature verification stays real (the real SDK), only the API
        // calls are the double.
        stripe: stripeDouble.api,
    }
})

function must<T>(value: T | undefined): T {
    if (value === undefined) throw new Error("missing value")
    return value
}

async function createCase(overrides: Record<string, unknown> = {}) {
    const customer = await prisma.user.create({
        data: { email: `customer-${Math.random()}@dentora.gr`, name: "Customer", role: "DENTIST" },
    })
    const designerUser = await prisma.user.create({
        data: { email: `designer-${Math.random()}@dentora.gr`, name: "Designer", role: "DESIGNER" },
    })
    const designer = await prisma.designerProfile.create({
        data: { userId: designerUser.id, headline: "CAD Designer" },
    })

    const labCase = await prisma.labCase.create({
        data: {
            code: `LAB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            title: "Κορώνα",
            type: "Crown",
            material: "Zirconia",
            description: "Μονοκόρωνη κορώνα",
            customerId: customer.id,
            customerType: "DENTIST",
            status: "COMPLETED",
            assignedDesignerId: designer.id,
            agreedPrice: 120,
            platformFee: 12,
            designerPayout: 108,
            paymentStatus: "HELD",
            ...overrides,
        },
    })

    return { customer, designerUser, designer, labCase }
}

/** A connected account of the designer. */
async function connectDesigner(designerId: string) {
    const account = must(
        await stripeDouble.api.accounts.create({
            type: "express",
            country: "GR",
            capabilities: { transfers: { requested: true } },
        })
    )
    await prisma.designerProfile.update({
        where: { id: designerId },
        data: { stripeAccountId: account.id },
    })
    return account
}

describe("the escrow of the Lab", () => {
    beforeEach(async () => {
        stripeDouble.paymentIntents.clear()
        stripeDouble.charges.clear()
        stripeDouble.transfers.clear()
        stripeDouble.refunds.clear()
        stripeDouble.accounts.clear()
        stripeDouble.idempotency.clear()
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("creates the payment intent with the agreed amount and the currency of the platform", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { createCasePaymentIntentInternal } = await import("@/lib/lab-payments")

        const result = await createCasePaymentIntentInternal(labCase.id)
        expect(result.amountCents).toBe(12000)
        expect(result.payoutCents).toBe(10800)

        const intent = stripeDouble.paymentIntents.get(result.id)!
        expect(intent.currency).toBe("eur")
        expect(intent.amount).toBe(12000)
        expect(intent.metadata.labCaseId).toBe(labCase.id)
    })

    it("does not create a second payment intent for the same work", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { createCasePaymentIntentInternal } = await import("@/lib/lab-payments")

        const first = await createCasePaymentIntentInternal(labCase.id)
        const second = await createCasePaymentIntentInternal(labCase.id)

        expect(second.id).toBe(first.id)
        expect(stripeDouble.paymentIntents.size).toBe(1)
    })

    it("refuses a payment for a work that was already refunded", async () => {
        const { labCase } = await createCase({ paymentStatus: "REFUNDED" })
        const { createCasePaymentIntentInternal } = await import("@/lib/lab-payments")

        await expect(createCasePaymentIntentInternal(labCase.id)).rejects.toMatchObject({
            code: "REFUNDED",
        })
    })
})

describe("the release of the money", () => {
    beforeEach(async () => {
        stripeDouble.paymentIntents.clear()
        stripeDouble.charges.clear()
        stripeDouble.transfers.clear()
        stripeDouble.refunds.clear()
        stripeDouble.accounts.clear()
        stripeDouble.idempotency.clear()
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("uses the CHARGE of the payment as the source of the transfer", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)

        // The payment of the customer: the charge is the source of the transfer.
        const intent = must(await stripeDouble.api.paymentIntents.create({
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
        }))
        const chargeId = intent.latest_charge!
        expect(chargeId.startsWith("ch_")).toBe(true)

        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { stripePaymentIntentId: intent.id, stripeChargeId: chargeId },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(true)

        const transfer = [...stripeDouble.transfers.values()][0]
        // The id of the payment intent must never be used here: only a charge
        // can be the source of a transfer.
        expect(transfer.source_transaction).toBe(chargeId)
        expect(transfer.source_transaction?.startsWith("ch_")).toBe(true)
        expect(transfer.source_transaction?.startsWith("pi_")).toBe(false)
    })

    it("refuses the release when the payment intent id is used as the source", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)

        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )

        // The bug this test protects against: the payment intent id in the
        // source_transaction.
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { stripePaymentIntentId: intent.id, stripeChargeId: intent.id },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(result.reason).toBe("missing_charge")
        expect(stripeDouble.transfers.size).toBe(0)
    })

    it("refuses the release when there is no charge at all", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(result.reason).toBe("missing_charge")
        expect(stripeDouble.transfers.size).toBe(0)
    })

    it("writes the state and the earnings in one transaction", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)
        const intent = must(await stripeDouble.api.paymentIntents.create({
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
        }))
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: {
                stripePaymentIntentId: intent.id,
                stripeChargeId: intent.latest_charge,
            },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        await releaseCasePaymentInternal(labCase.id)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })

        expect(updated?.paymentStatus).toBe("RELEASED")
        expect(updated?.stripeTransferId).toBeTruthy()
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)
    })

    it("recovers when the transfer worked but the database update failed", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)
        const intent = must(await stripeDouble.api.paymentIntents.create({
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
        }))
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: {
                stripePaymentIntentId: intent.id,
                stripeChargeId: intent.latest_charge,
            },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        // The database is not available for a moment: the transfer is created,
        // the state cannot be written.
        const { prisma: prismaClient } = await import("@/lib/prisma")
        const transaction = vi
            .spyOn(prismaClient, "$transaction")
            .mockRejectedValueOnce(new Error("the database is not available"))

        const failed = await releaseCasePaymentInternal(labCase.id)
        expect(failed.released).toBe(false)
        expect(failed.reason).toBe("database_error")

        // The money went out, the state was not written.
        expect(stripeDouble.transfers.size).toBe(1)
        const afterFailure = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(afterFailure?.paymentStatus).toBe("HELD")

        transaction.mockRestore()

        // The release is repeated: the same transfer (the idempotency key) and
        // the state is written once.
        const retried = await releaseCasePaymentInternal(labCase.id)
        expect(retried.released).toBe(true)

        expect(stripeDouble.transfers.size).toBe(1)
        const afterRetry = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(afterRetry?.paymentStatus).toBe("RELEASED")
        expect(afterRetry?.stripeTransferId).toBe(
            [...stripeDouble.transfers.values()][0].id
        )

        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)
    })

    it("does not pay twice when two releases run at the same time", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)
        const intent = must(await stripeDouble.api.paymentIntents.create({
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
        }))
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: {
                stripePaymentIntentId: intent.id,
                stripeChargeId: intent.latest_charge,
            },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const results = await Promise.all([
            releaseCasePaymentInternal(labCase.id),
            releaseCasePaymentInternal(labCase.id),
        ])

        expect(stripeDouble.transfers.size).toBe(1)
        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)
        expect(results.some((result) => result.released)).toBe(true)
    })

    it("does not pay a work whose payment is not held", async () => {
        const { labCase, designer } = await createCase({ paymentStatus: "UNPAID" })
        await connectDesigner(designer.id)

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(result.reason).toBe("payment_not_held")
        expect(stripeDouble.transfers.size).toBe(0)
    })

    it("does not pay a work that is not completed", async () => {
        const { labCase, designer } = await createCase({ status: "IN_PRODUCTION" })
        await connectDesigner(designer.id)

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(result.reason).toBe("case_not_completed")
        expect(stripeDouble.transfers.size).toBe(0)
    })

    it("keeps the payout pending when the designer has no connected account", async () => {
        const { labCase } = await createCase()
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: {
                stripePaymentIntentId: intent.id,
                stripeChargeId: intent.latest_charge,
            },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(result.reason).toBe("designer_without_account")
        expect(stripeDouble.transfers.size).toBe(0)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
    })

    it("does not move a released or refunded work back to held", async () => {
        const { labCase } = await createCase({ paymentStatus: "RELEASED" })
        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")

        const released = await markCasePaymentHeldInternal(labCase.id, "pi_test", 12000)
        expect(released.applied).toBe(false)

        const refunded = await prisma.labCase.update({
            where: { id: labCase.id },
            data: { paymentStatus: "REFUNDED" },
        })
        const result = await markCasePaymentHeldInternal(labCase.id, "pi_test", 12000)
        expect(result.applied).toBe(false)
        expect(refunded.paymentStatus).toBe("REFUNDED")
    })

    it("does not overwrite the payment intent of a work", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { stripePaymentIntentId: "pi_first" },
        })

        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")
        const result = await markCasePaymentHeldInternal(labCase.id, "pi_second", 12000)

        expect(result.applied).toBe(false)
        expect(result.reason).toBe("another_payment_intent")

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.stripePaymentIntentId).toBe("pi_first")
    })

    it("uses an idempotency key per work, so a retry returns the same transfer", async () => {
        const { labCase, designer } = await createCase()
        await connectDesigner(designer.id)
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: {
                stripePaymentIntentId: intent.id,
                stripeChargeId: intent.latest_charge,
            },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        await releaseCasePaymentInternal(labCase.id)

        // The key is derived from the work: a retry returns the same transfer.
        const key = [...stripeDouble.idempotency.keys()].find((entry) =>
            entry.startsWith("tr:")
        )
        expect(key).toBe(`tr:lab:tr:${labCase.id}`)
    })

    it("does not pay a work whose payment was refunded", async () => {
        const { labCase, designer } = await createCase({ paymentStatus: "REFUNDED" })
        await connectDesigner(designer.id)

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(stripeDouble.transfers.size).toBe(0)
    })
})
