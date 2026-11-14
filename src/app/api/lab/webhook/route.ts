import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/stripe"
import {
    claimWebhookEvent,
    markCasePaymentHeldInternal,
} from "@/lib/lab-payments"

// Stripe webhook for the Lab marketplace (escrow capture on the platform).
//
// The handler is idempotent: every event id is remembered, so a retry of the
// same event never changes the state twice. The money state can only be moved
// by a verified event whose amount matches the agreed price of the case.
export async function POST(request: Request) {
    const payload = await request.text()
    const signature = request.headers.get("stripe-signature") || ""
    const secret = process.env.STRIPE_LAB_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""

    if (!secret) {
        console.error(
            "[lab-webhook] Missing STRIPE_LAB_WEBHOOK_SECRET (or STRIPE_WEBHOOK_SECRET): the event is rejected."
        )
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 })
    }

    let event
    try {
        event = await verifyWebhookSignature(payload, signature, secret)
    } catch (error) {
        console.error("[lab-webhook] Invalid signature:", error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        // A retried event is ignored.
        const isNew = await claimWebhookEvent(event.id, event.type)
        if (!isNew) {
            return NextResponse.json({ received: true, duplicate: true })
        }

        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (caseId) {
                    const result = await markCasePaymentHeldInternal(
                        caseId,
                        intent.id,
                        intent.amount
                    )
                    if (!result.applied) {
                        console.warn(`[lab-webhook] payment_intent.succeeded ignored: ${result.reason}`)
                    }
                }
                break
            }
            case "payment_intent.payment_failed": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (caseId) {
                    await prisma.labCase.updateMany({
                        where: { id: caseId, paymentStatus: { in: ["UNPAID", "FAILED"] } },
                        data: { paymentStatus: "FAILED" },
                    })
                }
                break
            }
            case "payment_intent.canceled": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (caseId) {
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
                        !!account.details_submitted && !!account.payouts_enabled
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
        // The event is released again, so Stripe can retry it.
        await prisma.labWebhookEvent
            .delete({ where: { id: event.id } })
            .catch(() => undefined)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
