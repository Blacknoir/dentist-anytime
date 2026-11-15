import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/stripe"
import {
    getLabWebhookSecret,
    markCasePaymentHeldInternal,
    processLabWebhookEvent,
} from "@/lib/lab-payments"

// Stripe webhook for the Lab marketplace (escrow capture on the platform).
//
export async function POST(request: Request) {
    const payload = await request.text()
    const signature = request.headers.get("stripe-signature") || ""

    // The Lab has its own endpoint in Stripe and therefore its own signing
    // secret. The secret of another endpoint does not validate these events.
    const secret = getLabWebhookSecret()

    if (!secret) {
        console.error(
            "[lab-webhook] STRIPE_LAB_WEBHOOK_SECRET is not configured: the events of the Lab cannot be verified."
        )
        return NextResponse.json(
            { error: "The signing secret of the Lab webhook is not configured" },
            { status: 500 }
        )
    }

    let event
    try {
        event = await verifyWebhookSignature(payload, signature, secret)
    } catch (error) {
        console.error("[lab-webhook] Invalid signature:", error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        const existing = await prisma.labWebhookEvent.findUnique({
            where: { id: event.id },
            select: { completedAt: true },
        })
        if (existing?.completedAt) return NextResponse.json({ received: true, duplicate: true })

        // Resolve the charge before opening a database transaction.
        let chargeId: string | null = null
        if (event.type === "payment_intent.succeeded" && event.data.object.metadata?.labCaseId) {
            chargeId = await resolveChargeId(event.data.object)
            if (!chargeId) throw new Error("No charge found for the successful Lab payment")
        }

        const applied = await processLabWebhookEvent(event.id, event.type, async (tx) => {
            switch (event.type) {
                case "payment_intent.succeeded": {
                    const intent = event.data.object
                    const caseId = intent.metadata?.labCaseId
                    if (!caseId) {
                        console.warn("[lab-webhook] payment_intent.succeeded without a case")
                        break
                    }

                    const result = await markCasePaymentHeldInternal(
                        caseId,
                        intent.id,
                        intent.amount,
                        chargeId,
                        intent.currency,
                        tx
                    )
                    if (!result.applied) {
                        console.warn(`[lab-webhook] payment_intent.succeeded ignored: ${result.reason}`)
                    }
                    break
                }
                case "payment_intent.payment_failed":
                case "payment_intent.canceled": {
                    const intent = event.data.object
                    const caseId = intent.metadata?.labCaseId
                    if (caseId) {
                        // Only a work that was not paid can become FAILED.
                        await tx.labCase.updateMany({
                            where: {
                                id: caseId,
                                stripePaymentIntentId: intent.id,
                                paymentStatus: { in: ["UNPAID", "FAILED"] },
                            },
                            data: { paymentStatus: "FAILED" },
                        })
                    }
                    break
                }
                case "charge.refunded": {
                    const charge = event.data.object
                    const intentId = typeof charge.payment_intent === "string"
                        ? charge.payment_intent
                        : charge.payment_intent?.id
                    if (charge.refunded && intentId) {
                        await tx.labCase.updateMany({
                            where: {
                                stripePaymentIntentId: intentId,
                                OR: [{ stripeChargeId: charge.id }, { stripeChargeId: null }],
                                paymentStatus: { notIn: ["RELEASED", "REFUNDED"] },
                            },
                            data: { paymentStatus: "REFUNDED" },
                        })
                    }
                    break
                }
                case "account.updated": {
                    // The state of a connected account can change (verification,
                    // payouts enabled). The database is kept in sync so the
                    // dashboard does not show a stale state.
                    const account = event.data.object
                    await tx.designerProfile.updateMany({
                        where: { stripeAccountId: account.id },
                        data: {
                            isStripeEnabled: !!account.details_submitted &&
                                account.capabilities?.transfers === "active",
                        },
                    })
                    break
                }
                default:
                    break
            }
        })
        return NextResponse.json(applied ? { received: true } : { received: true, duplicate: true })
    } catch (error) {
        console.error("[lab-webhook] Handler error:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }
}

/**
 * The id of the charge of a payment intent. It is needed for the escrow
 * transfer: only a charge can be the source transaction.
 */
async function resolveChargeId(intent: { id: string; latest_charge?: string | { id?: string } | null }) {
    const latest = intent.latest_charge
    if (typeof latest === "string" && latest.startsWith("ch_")) {
        return latest
    }
    if (latest && typeof latest === "object" && typeof latest.id === "string") {
        if (latest.id.startsWith("ch_")) return latest.id
    }

    const { stripe } = await import("@/lib/stripe")
    const charge = await stripe.charges.list({ payment_intent: intent.id, limit: 1 })
    const id = charge.data[0]?.id
    return typeof id === "string" && id.startsWith("ch_") ? id : null
}
