"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface StripeReturnClientProps {
    isFullyConnected: boolean
}

export function StripeReturnClient({ isFullyConnected }: StripeReturnClientProps) {
    const { t } = useLanguage()

    if (!isFullyConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
                    <AlertCircle className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('stripe.setup_incomplete') || 'Payment Setup Incomplete'}
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {t('stripe.setup_incomplete_desc') || 'Your Stripe account setup is not yet complete. Please return to the dashboard to finish the setup process.'}
                    </p>
                </div>
                <Button asChild className="mt-8">
                    <Link href="/dashboard">{t('stripe.return_dashboard') || 'Return to Dashboard'}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="p-4 bg-green-50 text-green-600 rounded-full">
                <CheckCircle className="h-12 w-12" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('stripe.setup_complete') || 'Payment Setup Complete!'}
                </h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    {t('stripe.setup_complete_desc') || 'Your Stripe account has been successfully connected. You can now accept payments for your bookings.'}
                </p>
            </div>
            <Button asChild className="mt-8">
                <Link href="/dashboard">{t('stripe.return_dashboard') || 'Return to Dashboard'}</Link>
            </Button>
        </div>
    )
}
