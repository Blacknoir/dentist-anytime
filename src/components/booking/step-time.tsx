"use client"

import { Calendar, Clock } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface StepTimeProps {
    selectedDate: string
    selectedTime: string
}

export function StepTime({ selectedDate, selectedTime }: StepTimeProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.booking.confirm_date_time')}</h2>

            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-primary-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-primary-600 font-medium mb-1">{t('pages.booking.date')}</p>
                        <p className="text-lg font-bold text-gray-900">{selectedDate}</p>
                    </div>
                </div>

                <div className="w-full h-px bg-primary-200/50 my-4" />

                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-primary-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-primary-600 font-medium mb-1">{t('pages.booking.time')}</p>
                        <p className="text-lg font-bold text-gray-900">{selectedTime}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-500 text-center">
                {t('pages.booking.change_step_hint')}
            </p>
        </div>
    )
}
