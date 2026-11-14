import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"

const transferCreate = vi.fn(async (_params: unknown, _options?: unknown) => ({ id: "tr_test" }))
const refundCreate = vi.fn(async (_params: unknown, _options?: unknown) => ({ id: "re_test" }))
const paymentIntentCreate = vi.fn(async (_params: unknown, _options?: unknown) => ({
    id: "pi_test",
    client_secret: "secret_test",
}))

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: "user_test", email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", () => ({
    stripe: {
        paymentIntents: { create: paymentIntentCreate },
        transfers: { create: transferCreate },
        refunds: { create: refundCreate },
        accounts: { retrieve: vi.fn(), create: vi.fn() },
        accountLinks: { create: vi.fn() },
        webhooks: { constructEvent: vi.fn() },
    },
}))

async function createCase(overrides: Record<string, unknown> = {}) {
    const user = await prisma.user.create({
        data: { email: `owner-${Math.random()}@dentora.gr`, name: "Owner", role: "DENTIST" },
    })
    const designerUser = await prisma.user.create({
        data: { email: `designer-${Math.random()}@dentora.gr`, name: "Designer", role: "DESIGNER" },
    })
    const designer = await prisma.designerProfile.create({
        data: { userId: designerUser.id, headline: "CAD Designer", stripeAccountId: "acct_test" },
    })

    const labCase = await prisma.labCase.create({
        data: {
            code: `LAB-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
            title: "Κορώνα",
            type: "Crown",
            material: "Zirconia",
            description: "Μονοκόρωνη κορώνα",
            customerId: user.id,
            customerType: "DENTIST",
            status: "COMPLETED",
            assignedDesignerId: designer.id,
            agreedPrice: 120,
            platformFee: 12,
            designerPayout: 108,
            paymentStatus: "HELD",
            stripePaymentIntentId: "pi_test",
            ...overrides,
        },
    })

    return { user, designerUser, designer, labCase }
}

describe("the release of the money", () => {
    beforeEach(async () => {
        transferCreate.mockClear()
        refundCreate.mockClear()
        paymentIntentCreate.mockClear()
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("does not pay a work whose payment is not held", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        const result = await releaseCasePaymentInternal(labCase.id)
        expect(result.released).toBe(false)
        expect(transferCreate).not.toHaveBeenCalled()
    })

    it("does not pay a work that is not completed", async () => {
        const { labCase } = await createCase({ status: "IN_PRODUCTION" })
        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        const result = await releaseCasePaymentInternal(labCase.id)
        expect(result.released).toBe(false)
        expect(transferCreate).not.toHaveBeenCalled()
    })

    it("pays the designer once and credits the earnings once", async () => {
        const { labCase, designer } = await createCase()
        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        const result = await releaseCasePaymentInternal(labCase.id)
        expect(result.released).toBe(true)
        expect(transferCreate).toHaveBeenCalledTimes(1)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("RELEASED")
        expect(updated?.stripeTransferId).toBe("tr_test")

        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)
    })

    it("does not pay twice when the release is repeated", async () => {
        const { labCase, designer } = await createCase()
        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        await releaseCasePaymentInternal(labCase.id)
        const second = await releaseCasePaymentInternal(labCase.id)

        // The second call does not create a second transfer.
        expect(second.released).toBe(true)
        expect(transferCreate).toHaveBeenCalledTimes(1)

        const profile = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(profile?.earnings).toBe(108)
        expect(profile?.completedCases).toBe(1)
    })

    it("uses an idempotency key per work, so a retry returns the same transfer", async () => {
        const { labCase } = await createCase()
        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")

        await releaseCasePaymentInternal(labCase.id)
        const options = transferCreate.mock.calls[0]?.[1] as { idempotencyKey?: string } | undefined
        expect(options?.idempotencyKey).toBe(`lab:tr:${labCase.id}`)
    })

    it("keeps the payout pending when the designer has no Stripe account", async () => {
        const { labCase, designer } = await createCase()
        await prisma.designerProfile.update({
            where: { id: designer.id },
            data: { stripeAccountId: null },
        })

        const { releaseCasePaymentInternal } = await import("@/lib/lab-payments")
        const result = await releaseCasePaymentInternal(labCase.id)

        expect(result.released).toBe(false)
        expect(transferCreate).not.toHaveBeenCalled()
        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
    })
})

describe("the payment of the escrow", () => {
    beforeEach(async () => {
        paymentIntentCreate.mockClear()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("does not mark a payment as held when the amount does not match", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")

        // the intent belongs to the work, but the amount is not the agreed one
        const result = await markCasePaymentHeldInternal(labCase.id, "pi_test", 99999)
        expect(result.applied).toBe(false)
        expect(result.reason).toBe("amount_mismatch")

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("UNPAID")
    })

    it("marks the payment as held when the amount matches", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")

        const result = await markCasePaymentHeldInternal(labCase.id, "pi_test", 12000)
        expect(result.applied).toBe(true)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
    })

    it("never moves a released or refunded work back to held", async () => {
        const { labCase } = await createCase({ paymentStatus: "RELEASED" })
        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")

        const result = await markCasePaymentHeldInternal(labCase.id, "pi_test", 12000)
        expect(result.applied).toBe(false)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("RELEASED")
    })

    it("does not overwrite the payment intent of a work", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID", stripePaymentIntentId: "pi_first" })
        const { markCasePaymentHeldInternal } = await import("@/lib/lab-payments")

        const result = await markCasePaymentHeldInternal(labCase.id, "pi_second", 12000)
        expect(result.applied).toBe(false)
        expect(result.reason).toBe("another_payment_intent")

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.stripePaymentIntentId).toBe("pi_first")
    })

    it("creates the payment intent with an idempotency key per work", async () => {
        const { labCase } = await createCase({ paymentStatus: "UNPAID" })
        const { createCasePaymentIntentInternal } = await import("@/lib/lab-payments")

        await createCasePaymentIntentInternal(labCase.id)
        const options = paymentIntentCreate.mock.calls[0]?.[1] as { idempotencyKey?: string } | undefined
        expect(options?.idempotencyKey).toBe(`lab:pi:${labCase.id}`)
    })
})

describe("the webhook of the lab", () => {
    beforeEach(async () => {
        await prisma.labWebhookEvent.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("processes an event only once", async () => {
        const { claimWebhookEvent } = await import("@/lib/lab-payments")

        expect(await claimWebhookEvent("evt_1", "payment_intent.succeeded")).toBe(true)
        expect(await claimWebhookEvent("evt_1", "payment_intent.succeeded")).toBe(false)
        expect(await claimWebhookEvent("evt_2", "payment_intent.succeeded")).toBe(true)
    })

    it("refunds only once", async () => {
        const { labCase } = await createCase({ paymentStatus: "HELD" })
        const { refundCasePaymentInternal } = await import("@/lib/lab-payments")

        const first = await refundCasePaymentInternal(labCase.id)
        expect(first.refunded).toBe(true)
        expect(refundCreate).toHaveBeenCalledTimes(1)

        const second = await refundCasePaymentInternal(labCase.id)
        expect(second.refunded).toBe(true)
        expect(refundCreate).toHaveBeenCalledTimes(1)

        const options = refundCreate.mock.calls[0]?.[1] as { idempotencyKey?: string } | undefined
        expect(options?.idempotencyKey).toBe(`lab:refund:${labCase.id}`)
    })
})
