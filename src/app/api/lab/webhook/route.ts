import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature } from "@/lib/stripe"
import { markCasePaymentHeld } from "@/app/actions/lab"

// Stripe webhook for the Lab marketplace (escrow capture on the platform).
export async function POST(request: Request) {
    const payload = await request.text()
    const signature = request.headers.get("stripe-signature") || ""
    const secret = process.env.STRIPE_LAB_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || ""

    let event
    try {
        event = await verifyWebhookSignature(payload, signature, secret)
    } catch (error) {
        console.error("[lab-webhook] Invalid signature:", error)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (caseId) {
                    await markCasePaymentHeld(caseId, intent.id)
                }
                break
            }
            case "payment_intent.payment_failed": {
                const intent = event.data.object
                const caseId = intent.metadata?.labCaseId
                if (caseId) {
                    await prisma.labCase.update({
                        where: { id: caseId },
                        data: { paymentStatus: "FAILED" },
                    })
                }
                break
            }
            case "charge.refunded": {
                const charge = event.data.object
                const caseId = charge.metadata?.labCaseId
                if (caseId) {
                    await prisma.labCase.update({
                        where: { id: caseId },
                        data: { paymentStatus: "REFUNDED" },
                    })
                }
                break
            }
            default:
                break
        }
    } catch (error) {
        console.error("[lab-webhook] Handler error:", error)
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
    }

    return NextResponse.json({ received: true })
}
