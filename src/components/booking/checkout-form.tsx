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
        setErrorMessage(null)

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/booking/success`,
                },
                redirect: "if_required",
            })

            if (error) {
                setErrorMessage(error.message ?? "An unknown error occurred")
                setLoading(false)
            } else if (paymentIntent) {
                if (paymentIntent.status === "succeeded") {
                    onSuccess(paymentIntent.id)
                } else if (paymentIntent.status === "processing") {
                    // For methods like Bancontact, Klarna, EPS that may take time
                    onSuccess(paymentIntent.id)
                } else if (paymentIntent.status === "requires_action") {
                    // Stripe will handle the redirect automatically
                    // If we reach here without redirect, show message
                    setErrorMessage("Additional authentication required. Please follow the instructions.")
                    setLoading(false)
                } else {
                    setErrorMessage(`Payment status: ${paymentIntent.status}. Please try again.`)
                    setLoading(false)
                }
            } else {
                setErrorMessage("No response from payment processor. Please try again.")
                setLoading(false)
            }
        } catch (err: any) {
            console.error("Payment processing error:", err)
            setErrorMessage(err.message || "An unexpected error occurred during payment.")
            setLoading(false)
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
