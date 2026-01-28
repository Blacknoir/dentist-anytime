import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, getCommissionRate } from '@/lib/stripe'
import Stripe from 'stripe'

export async function POST(request: Request) {
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature') || ''

        // Verify webhook signature
        const event = await verifyWebhookSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '')

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const bookingId = session.metadata?.bookingId

                if (!bookingId) {
                    console.error('No booking ID in checkout session')
                    break
                }

                // Update booking with payment details
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        paymentStatus: 'COMPLETED',
                        stripePaymentId: session.id,
                    },
                })

                // Update dentist earnings
                const booking = await prisma.booking.findUnique({
                    where: { id: bookingId },
                    include: { dentistProfile: true },
                })

                if (booking?.dentistProfile) {
                    const commissionRate = getCommissionRate()
                    const commissionAmount = booking.price * commissionRate

                    await prisma.dentistProfile.update({
                        where: { id: booking.dentistProfile.id },
                        data: {
                            earnings: {
                                increment: booking.price - commissionAmount,
                            },
                        },
                    })

                    // Update booking with commission amount
                    await prisma.booking.update({
                        where: { id: bookingId },
                        data: {
                            commissionAmount: commissionAmount,
                        },
                    })
                }

                break
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                const bookingId = paymentIntent.metadata?.bookingId

                if (!bookingId) {
                    console.error('No booking ID in payment intent')
                    break
                }

                // Update booking payment status
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        paymentStatus: 'COMPLETED',
                        stripePaymentId: paymentIntent.id,
                    },
                })

                break
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                const bookingId = paymentIntent.metadata?.bookingId

                if (!bookingId) {
                    console.error('No booking ID in failed payment intent')
                    break
                }

                // Update booking payment status to failed
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: {
                        paymentStatus: 'FAILED',
                    },
                })

                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 })
    }
}
