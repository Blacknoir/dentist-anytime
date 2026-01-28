"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/LanguageContext"

interface StepServiceProps {
    selectedService: string | null
    onSelect: (service: string) => void
}

export function StepService({ selectedService, onSelect }: StepServiceProps) {
    const { t } = useLanguage()

    const services = [
        { id: "checkup", name: t('popular.cleaning_title'), price: "$50", duration: `30 ${t('time.min')}` },
        { id: "cleaning", name: t('popular.cleaning_title'), price: "$120", duration: `45 ${t('time.min')}` },
        { id: "whitening", name: t('popular.whitening_title'), price: "$350", duration: `60 ${t('time.min')}` },
        { id: "emergency", name: t('popular.emergency_title'), price: "$80", duration: `30 ${t('time.min')}` },
    ]

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.booking.step1')}</h2>
            <div className="grid grid-cols-1 gap-4">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service.id)}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group",
                            selectedService === service.id
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-100 bg-white hover:border-primary-200 hover:shadow-sm"
                        )}
                    >
                        <div>
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-900">{service.price}</span>
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                    selectedService === service.id
                                        ? "border-primary-500 bg-primary-500 text-white"
                                        : "border-gray-300 group-hover:border-primary-400"
                                )}
                            >
                                {selectedService === service.id && <Check className="h-3 w-3" />}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
