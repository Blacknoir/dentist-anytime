"use client"

import React, { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { CheckoutForm } from "./checkout-form"
import { createPaymentIntent } from "@/app/actions/stripe"
import { useLanguage } from "@/lib/LanguageContext"
import { Loader2 } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentProps {
    dentistProfileId: string
    onSuccess: (paymentIntentId: string) => void
}

interface Breakdown {
    depositCents: number
    feeCents: number
    totalCents: number
    hasDeposit: boolean
}

export function StripePayment({ dentistProfileId, onSuccess }: StripePaymentProps) {
    const { t } = useLanguage()
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Create PaymentIntent as soon as the component mounts.
        // Τα ποσά υπολογίζονται server-side (deposit + €3 fee).
        createPaymentIntent(0, dentistProfileId)
            .then((res: any) => {
                if (res.error) {
                    setError(res.error)
                } else if (res.clientSecret) {
                    setClientSecret(res.clientSecret)
                    setBreakdown({
                        depositCents: res.depositCents ?? 0,
                        feeCents: res.feeCents ?? 0,
                        totalCents: res.totalCents ?? 0,
                        hasDeposit: !!res.hasDeposit,
                    })
                }
            })
            .catch((err) => {
                console.error("Failed to create payment intent:", err)
                setError(err.message || "Could not initialize payment. Please try again.")
            })
    }, [dentistProfileId])

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center">
                {error}
            </div>
        )
    }

    if (!clientSecret || !breakdown) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <p className="text-gray-500">Initializing secure payment...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-2 text-sm">
                {breakdown.hasDeposit && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">{t('pages.booking.deposit')}</span>
                        <span className="font-bold text-gray-900">€{(breakdown.depositCents / 100).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-500">{t('pages.booking.platform_fee')}</span>
                    <span className="font-bold text-gray-900">€{(breakdown.feeCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-200 pt-2">
                    <span className="font-bold text-gray-900">{t('pages.booking.total')}</span>
                    <span className="font-black text-lg text-primary-600">€{(breakdown.totalCents / 100).toFixed(2)}</span>
                </div>
                {!breakdown.hasDeposit && (
                    <p className="text-xs text-gray-500 pt-1">{t('pages.booking.fee_only_note')}</p>
                )}
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm amount={breakdown.totalCents} onSuccess={onSuccess} />
            </Elements>
        </div>
    )
}
