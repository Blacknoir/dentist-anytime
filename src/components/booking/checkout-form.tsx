"use client"

import React, { useState } from "react"
import {
    PaymentElement,
    useStripe,
    useElements
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CheckoutFormProps {
    amount: number
    onSuccess: (paymentIntentId: string) => void
}

export function CheckoutForm({ amount, onSuccess }: CheckoutFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) {
            return
        }

        setLoading(true)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        })

        if (error) {
            setErrorMessage(error.message ?? "An unknown error occurred")
            setLoading(false)
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {errorMessage}
                </div>
            )}
            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full h-12 text-lg font-semibold"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    `Pay €${(amount / 100).toFixed(2)}`
                )}
            </Button>
        </form>
    )
}
