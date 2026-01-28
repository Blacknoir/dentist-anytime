import Stripe from 'stripe'

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
    typescript: true,
})

// Commission percentage for platform
const COMMISSION_RATE = 0.10 // 10%

export interface CreateCheckoutSessionParams {
    bookingId: string
    serviceName: string
    price: number
    successUrl: string
    cancelUrl: string
}

/**
 * Create a Stripe Checkout Session for booking payment
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
    const { bookingId, serviceName, price, successUrl, cancelUrl } = params

    const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: serviceName,
                        description: `Dental appointment: ${serviceName}`,
                    },
                    unit_amount: price * 100, // Stripe uses cents
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            bookingId: bookingId,
        },
        client_reference_id: bookingId,
    })

    return checkoutSession
}

/**
 * Create a Stripe Payment Intent for direct payment
 */
export async function createPaymentIntent(params: {
    amount: number
    bookingId: string
    description: string
}) {
    const { amount, bookingId, description } = params

    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses cents
        currency: 'eur',
        metadata: {
            bookingId: bookingId,
        },
        description: description,
    })

    return paymentIntent
}

/**
 * Calculate commission amount
 */
export function calculateCommission(amount: number): number {
    return amount * COMMISSION_RATE
}

/**
 * Get amount after commission (for dentist)
 */
export function getDentistAmount(amount: number): number {
    return amount - calculateCommission(amount)
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<Stripe.Event> {
    return stripe.webhooks.constructEvent(payload, signature, secret)
}

/**
 * Get Stripe API key for client-side use
 */
export function getStripePublicKey(): string {
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
}

/**
 * Get commission rate from environment or use default
 */
export function getCommissionRate(): number {
    const rate = process.env.COMMISSION_RATE
    return rate ? parseFloat(rate) / 100 : COMMISSION_RATE
}

export { stripe }
