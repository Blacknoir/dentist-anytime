import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/stripe"
import {
    claimWebhookEvent,
    markCasePaymentHeldInternal,
    releaseWebhookEvent,
} from "@/lib/lab-payments"

// Stripe webhook for the Lab marketplace (escrow capture on the platform).
//
// The handler is idempotent: every event id is remembered, so a retry of the
// same event never changes the state twice. A claim that was left behind by a
// process that died is released after a few minutes, so the event is not lost
// for good. The money state can only be moved by a verified event whose
// amount and currency match the agreed price of the case.
export async function POST(request: Request) {
    const payload = await request.text()
    const signature = request.headers.get("stripe-signature") || ""

    // The Lab has its own endpoint in Stripe and therefore its own signing
    // secret. The secret of another endpoint does not validate these events.
    const secret = process.env.STRIPE_LAB_WEBHOOK_SECRET || ""

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
        // A retried event is ignored, a claim of a dead process is released.
        const isNew = await claimWebhookEvent(event.id, event.type)
        if (!isNew) {
            return NextResponse.json({ received: true, duplicate: true })
        }

        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (!caseId) {
                    console.warn("[lab-webhook] payment_intent.succeeded without a case")
                    break
                }

                // The charge is the source of the escrow transfer: the id of
                // the payment intent must not be used there.
                const chargeId = await resolveChargeId(intent as { id: string; latest_charge?: string | { id?: string } | null })

                const result = await markCasePaymentHeldInternal(
                    caseId,
                    intent.id,
                    intent.amount,
                    chargeId,
                    intent.currency
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
                    await prisma.labCase.updateMany({
                        where: { id: caseId, paymentStatus: { in: ["UNPAID", "FAILED"] } },
                        data: { paymentStatus: "FAILED" },
                    })
                }
                break
            }
            case "charge.refunded": {
                const charge = event.data.object
                const caseId = charge.metadata?.labCaseId
                if (caseId) {
                    // A released payment is not reverted: the money went to
                    // the designer already.
                    await prisma.labCase.updateMany({
                        where: { id: caseId, paymentStatus: { not: "RELEASED" } },
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
                const designer = await prisma.designerProfile.findFirst({
                    where: { stripeAccountId: account.id },
                    select: { id: true },
                })
                if (designer) {
                    const enabled =
                        !!account.details_submitted &&
                        account.capabilities?.transfers === "active"
                    await prisma.designerProfile.update({
                        where: { id: designer.id },
                        data: { isStripeEnabled: enabled },
                    })
                }
                break
            }
            default:
                break
        }
    } catch (error) {
        console.error("[lab-webhook] Handler error:", error)
        // The claim is released, so that Stripe can retry the event.
        await releaseWebhookEvent(event.id)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
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

    try {
        const { stripe } = await import("@/lib/stripe")
        const charge = await stripe.charges.list({
            payment_intent: intent.id,
            limit: 1,
        })
        const id = charge.data[0]?.id
        return typeof id === "string" && id.startsWith("ch_") ? id : null
    } catch (error) {
        console.error("[lab-webhook] The charge of the payment could not be read:", error)
        return null
    }
}
