import { beforeEach, describe, expect, it, vi } from "vitest"
import { prisma } from "@/lib/prisma"
import { createStripeTestDouble } from "../mocks/stripe-strict"

// The webhook is tested with a REAL signature: the payload is signed with
// the real SDK (the same way Stripe signs it) and the route verifies it with
// the real verification. Only the API calls are the double.

const WEBHOOK_SECRET = "whsec_test_secret_for_the_lab"
const stripeDouble = createStripeTestDouble()

vi.mock("@/auth", () => ({
    auth: async () => ({ user: { id: "user_test", email: "test@dentora.gr" } }),
}))

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }))

vi.mock("@/lib/stripe", async () => {
    const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe")
    return {
        ...actual,
        stripe: {
            ...stripeDouble.api,
            // The real signature verification stays untouched.
            webhooks: (actual.stripe as unknown as { webhooks: unknown }).webhooks,
        },
    }
})

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
            status: "ASSIGNED",
            assignedDesignerId: designer.id,
            agreedPrice: 120,
            paymentStatus: "UNPAID",
            ...overrides,
        },
    })
    return { customer, designerUser, designer, labCase }
}

/** Signs a payload exactly like Stripe does. */
async function sign(payload: string) {
    const { stripe } = await import("@/lib/stripe")
    const webhooks = (stripe as unknown as { webhooks: { generateTestHeaderString: (opts: { payload: string; secret: string }) => string } }).webhooks
    const header = webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
    })
    return header as string
}

async function postEvent(event: unknown, signature?: string) {
    const { POST } = await import("@/app/api/lab/webhook/route")
    const payload = JSON.stringify(event)
    const header = signature ?? (await sign(payload))

    const request = new Request("https://www.dentora.gr/api/lab/webhook", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "stripe-signature": header,
        },
        body: payload,
    })

    return POST(request)
}

function must<T>(value: T | undefined): T {
    if (value === undefined) throw new Error("missing value")
    return value
}

function paymentIntentEvent(id: string, intent: Record<string, unknown>) {
    return {
        id,
        object: "event",
        type: "payment_intent.succeeded",
        data: { object: { object: "payment_intent", ...intent } },
    }
}

describe("the webhook of the Lab", () => {
    beforeEach(async () => {
        process.env.STRIPE_LAB_WEBHOOK_SECRET = WEBHOOK_SECRET
        stripeDouble.paymentIntents.clear()
        stripeDouble.charges.clear()
        stripeDouble.transfers.clear()
        stripeDouble.refunds.clear()
        stripeDouble.accounts.clear()
        stripeDouble.idempotency.clear()
        await prisma.labWebhookEvent.deleteMany()
        await prisma.labCaseFile.deleteMany()
        await prisma.labOffer.deleteMany()
        await prisma.labCase.deleteMany()
        await prisma.designerProfile.deleteMany()
        await prisma.user.deleteMany()
    })

    it("rejects a payload without a valid signature", async () => {
        const { labCase } = await createCase()
        const event = paymentIntentEvent("evt_bad", {
            id: "pi_x",
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
            latest_charge: "ch_x",
        })

        const res = await postEvent(event, "t=1,v1=deadbeef")
        expect(res.status).toBe(400)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("UNPAID")
    })

    it("marks the work as paid and stores the charge", async () => {
        const { labCase } = await createCase()
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )

        const event = paymentIntentEvent("evt_ok", {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata,
            latest_charge: intent.latest_charge,
        })

        const res = await postEvent(event)
        expect(res.status).toBe(200)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
        expect(updated?.stripePaymentIntentId).toBe(intent.id)
        expect(updated?.stripeChargeId).toBe(intent.latest_charge)
        expect(updated?.stripeChargeId?.startsWith("ch_")).toBe(true)
    })

    it("ignores a retry of the same event", async () => {
        const { labCase } = await createCase()
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        const event = paymentIntentEvent("evt_retry", {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata,
            latest_charge: intent.latest_charge,
        })

        const responses = await Promise.all([postEvent(event), postEvent(event)])
        expect(responses.map((response) => response.status)).toEqual([200, 200])
        const bodies = await Promise.all(responses.map((response) => response.json()))
        expect(bodies.filter((body) => body.duplicate)).toHaveLength(1)
        expect(await prisma.labWebhookEvent.count({ where: { id: "evt_retry" } })).toBe(1)

        const old = new Date(Date.now() - 2 * 86400 * 1000)
        await prisma.labWebhookEvent.update({
            where: { id: "evt_retry" },
            data: { createdAt: old, completedAt: old },
        })
        expect(await (await postEvent(event)).json()).toMatchObject({ duplicate: true })
        const saved = await prisma.labWebhookEvent.findUnique({ where: { id: "evt_retry" } })
        expect(saved?.completedAt).toEqual(old)
    })

    it("replays an event with an unconfirmed claim from the old handler", async () => {
        const { labCase } = await createCase()
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        const event = paymentIntentEvent("evt_stale", {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata,
            latest_charge: intent.latest_charge,
        })

        // A claim that was left behind 10 minutes ago (the process died).
        await prisma.labWebhookEvent.create({
            data: {
                id: "evt_stale",
                type: "payment_intent.succeeded",
                createdAt: new Date(Date.now() - 10 * 60 * 1000),
            },
        })

        const res = await postEvent(event)
        expect(res.status).toBe(200)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")
    })

    it("rolls back the marker and case update if processing stops before commit", async () => {
        const { labCase } = await createCase()
        const { processLabWebhookEvent } = await import("@/lib/lab-payments")
        await expect(processLabWebhookEvent("evt_rollback", "payment_intent.succeeded", async (tx) => {
            await tx.labCase.update({ where: { id: labCase.id }, data: { paymentStatus: "HELD" } })
            throw new Error("interrupted before commit")
        })).rejects.toThrow("interrupted before commit")
        expect(await prisma.labWebhookEvent.findUnique({ where: { id: "evt_rollback" } })).toBeNull()
        const unchanged = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(unchanged?.paymentStatus).toBe("UNPAID")

        const response = await postEvent(paymentIntentEvent("evt_rollback", {
            id: "pi_retry",
            amount: 12000,
            currency: "eur",
            metadata: { labCaseId: labCase.id },
            latest_charge: "ch_retry",
        }))
        expect(response.status).toBe(200)
        const saved = await prisma.labWebhookEvent.findUnique({ where: { id: "evt_rollback" } })
        expect(saved?.completedAt).toBeInstanceOf(Date)
    })

    it("does not mark a work as paid when the amount does not match", async () => {
        const { labCase } = await createCase()
        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 9999,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        const event = paymentIntentEvent("evt_amount", {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata,
            latest_charge: intent.latest_charge,
        })

        const res = await postEvent(event)
        expect(res.status).toBe(200)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("UNPAID")
    })

    it("does not mark a work as paid when the currency is not the one of the platform", async () => {
        const { labCase } = await createCase()
        const event = paymentIntentEvent("evt_currency", {
            id: "pi_usd",
            amount: 12000,
            currency: "usd",
            metadata: { labCaseId: labCase.id },
            latest_charge: "ch_usd",
        })

        const res = await postEvent(event)
        expect(res.status).toBe(200)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("UNPAID")
    })

    it("does not overwrite the payment intent of another work", async () => {
        const { labCase } = await createCase()
        await prisma.labCase.update({
            where: { id: labCase.id },
            data: { stripePaymentIntentId: "pi_first" },
        })

        const intent = must(
            await stripeDouble.api.paymentIntents.create({
                amount: 12000,
                currency: "eur",
                metadata: { labCaseId: labCase.id },
            })
        )
        const event = paymentIntentEvent("evt_other_pi", {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            metadata: intent.metadata,
            latest_charge: intent.latest_charge,
        })

        await postEvent(event)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("UNPAID")
        expect(updated?.stripePaymentIntentId).toBe("pi_first")
    })

    it("handles the events that arrive in the wrong order", async () => {
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
            data: { stripePaymentIntentId: intent.id },
        })

        // The payment fails first...
        const failed = {
            id: "evt_failed",
            object: "event",
            type: "payment_intent.payment_failed",
            data: {
                object: {
                    object: "payment_intent",
                    id: intent.id,
                    amount: intent.amount,
                    currency: intent.currency,
                    metadata: intent.metadata,
                },
            },
        }
        await postEvent(failed)

        let updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("FAILED")

        // ... and succeeds afterwards.
        await postEvent(
            paymentIntentEvent("evt_succeeded_after", {
                id: intent.id,
                amount: intent.amount,
                currency: intent.currency,
                metadata: intent.metadata,
                latest_charge: intent.latest_charge,
            })
        )

        updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("HELD")

        // A refund afterwards wins, a released payment does not.
        await postEvent({
            id: "evt_refund",
            object: "event",
            type: "charge.refunded",
            data: {
                object: {
                    object: "charge",
                    id: intent.latest_charge,
                    payment_intent: intent.id,
                    refunded: true,
                },
            },
        })

        updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("REFUNDED")
    })

    it("does not refund a work whose payment was already released", async () => {
        const { labCase } = await createCase({ paymentStatus: "RELEASED" })
        const event = {
            id: "evt_refund_released",
            object: "event",
            type: "charge.refunded",
            data: {
                object: {
                    object: "charge",
                    id: "ch_x",
                    metadata: { labCaseId: labCase.id },
                },
            },
        }

        await postEvent(event)

        const updated = await prisma.labCase.findUnique({ where: { id: labCase.id } })
        expect(updated?.paymentStatus).toBe("RELEASED")
    })

    it("fails loudly when the signing secret is missing", async () => {
        delete process.env.STRIPE_LAB_WEBHOOK_SECRET
        try {
            const res = await postEvent({
                id: "evt_nosecret",
                object: "event",
                type: "payment_intent.succeeded",
                data: { object: { object: "payment_intent", id: "pi_x" } },
            })
            expect(res.status).toBe(500)
        } finally {
            process.env.STRIPE_LAB_WEBHOOK_SECRET = WEBHOOK_SECRET
        }
    })

    it("keeps the state of the connected accounts in sync", async () => {
        const { designer } = await createCase()
        const account = must(
            await stripeDouble.api.accounts.create({
                type: "express",
                country: "GR",
                capabilities: { transfers: { requested: true } },
            })
        )
        await prisma.designerProfile.update({
            where: { id: designer.id },
            data: { stripeAccountId: account.id },
        })

        await postEvent({
            id: "evt_account",
            object: "event",
            type: "account.updated",
            data: {
                object: {
                    object: "account",
                    id: account.id,
                    details_submitted: true,
                    charges_enabled: false,
                    payouts_enabled: true,
                    capabilities: { transfers: "active" },
                    requirements: { currently_due: [], disabled_reason: null },
                },
            },
        })

        const updated = await prisma.designerProfile.findUnique({ where: { id: designer.id } })
        expect(updated?.isStripeEnabled).toBe(true)
    })
})
