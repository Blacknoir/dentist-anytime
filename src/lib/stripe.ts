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

