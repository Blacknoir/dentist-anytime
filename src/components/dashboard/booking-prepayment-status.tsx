"use client"

import { useLanguage } from "@/lib/LanguageContext"
import { CreditCard } from "lucide-react"

interface BookingPrepaymentStatusProps {
    isPrepaid: boolean
    amount?: number
}

export function BookingPrepaymentStatus({ isPrepaid, amount }: BookingPrepaymentStatusProps) {
    const { t } = useLanguage()

    if (!isPrepaid) return null

    const displayAmount = amount ? `${amount}€` : ''

    return (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-md border border-primary-100 w-fit">
            <CreditCard className="h-3 w-3" />
            {t('pages.booking.prepayment_prefix')}{displayAmount}{t('pages.booking.prepayment_suffix')}
        </div>
    )
}
