import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
})

export function calculateCommission(amount: number, rate: number = 10) {
    return (amount * rate) / 100
}

export function getDentistAmount(amount: number, rate: number = 10) {
    return amount - calculateCommission(amount, rate)
}

export function getCommissionRate(): number {
    return 10 // Default 10% commission rate
}

export async function createCheckoutSession(params: {
    bookingId: string
    serviceName: string
    price: number
    successUrl: string
    cancelUrl: string
}) {
    const { bookingId, serviceName, price, successUrl, cancelUrl } = params

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: serviceName,
                    },
                    unit_amount: Math.round(price * 100), // Convert to cents
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            bookingId,
        },
    })

    return session
}

export async function verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
) {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

