"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"
import { cancelBooking } from "@/app/actions/booking"
import { Loader2, XCircle } from "lucide-react"

export function CancelBookingButton({ 
    bookingId, 
    bookingDateStr 
}: { 
    bookingId: string
    bookingDateStr: string
}) {
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)

    // Check if within 3 days
    const bookingDate = new Date(bookingDateStr)
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const canCancel = bookingDate > threeDaysFromNow

    const handleCancel = async () => {
        if (!confirm(t('booking.cancel_confirm'))) return

        setLoading(true)
        try {
            const result = await cancelBooking(bookingId)
            alert(`${t('booking.cancel_success')}\n${t('booking.cancel_refund_amount')}: €${result.refundAmount}\n${t('booking.cancel_refund_note')}`)
        } catch (error: any) {
            console.error(error)
            if (error.message === 'CANCEL_TOO_LATE') {
                alert(t('booking.cancel_too_late'))
            } else {
                alert(`Failed to cancel booking: ${error.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    if (!canCancel) {
        return (
            <p className="text-xs text-red-500 mt-2 text-right">
                {t('booking.cancel_too_late')}
            </p>
        )
    }

    return (
        <div className="flex flex-col items-end gap-1 mt-2">
            <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleCancel}
                disabled={loading}
                className="h-8 gap-1.5"
            >
                {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <XCircle className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">{loading ? t('booking.cancelling') : t('booking.cancel')}</span>
            </Button>
            <p className="text-[10px] text-gray-500 max-w-[150px] text-right">
                {t('booking.cancel_policy_short')}
            </p>
        </div>
    )
}
