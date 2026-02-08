"use client"

import React, { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { CheckoutForm } from "./checkout-form"
import { createPaymentIntent } from "@/app/actions/stripe"
import { Loader2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentProps {
    amount: number
    dentistProfileId: string
    onSuccess: (paymentIntentId: string) => void
}

export function StripePayment({ amount, dentistProfileId, onSuccess }: StripePaymentProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Create PaymentIntent as soon as the component mounts
        createPaymentIntent(amount, dentistProfileId)
            .then((res) => {
                setClientSecret(res.clientSecret!)
            })
            .catch((err) => {
                console.error("Failed to create payment intent:", err)
                setError("Could not initialize payment. Please try again.")
            })
    }, [amount, dentistProfileId])

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center">
                {error}
            </div>
        )
    }

    if (!clientSecret) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-gray-500">Initializing secure payment...</p>
            </div>
        )
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} />
        </Elements>
    )
}
