"use client"

import { Info } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useLanguage } from "@/lib/LanguageContext"

interface ServicesListProps {
    services: any[]
    consultationFee: number
}

export function ServicesList({ services, consultationFee }: ServicesListProps) {
    const { t } = useLanguage()

    // Group services and include the consultation fee as the first item
    const groupedServices = [
        {
            category: t('pages.profile.services_pricing'),
            items: [
                {
                    name: t('pages.profile.consultation_fee'),
                    price: `€${consultationFee}`,
                    duration: `30 ${t('time.min')}`,
                    isConsultation: true
                },
                ...services.map(s => ({
                    name: s.name,
                    price: `€${s.price}`,
                    duration: `${s.duration} ${t('time.min')}`,
                    isConsultation: false
                }))
            ]
        }
    ]

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900">{t('pages.profile.services_pricing')}</h2>
                <div className="bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">
                    <p className="text-xs font-medium text-primary-700">
                        {t('pages.profile.consultation_warning')}
                    </p>
                </div>
            </div>

            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {groupedServices.map((category, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b-0 mb-2">
                        <AccordionTrigger className="hover:no-underline bg-gray-50 px-4 rounded-lg text-gray-900 font-semibold text-left">
                            {category.category}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-4">
                            <div className="space-y-4">
                                {category.items.map((item, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between group gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                {item.isConsultation && (
                                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        Required
                                                    </span>
                                                )}
                                                <Info className="h-4 w-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-sm text-gray-500">{item.duration}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-bold text-gray-900 text-lg">{item.price}</span>
                                            {!item.isConsultation && (
                                                <span className="text-[10px] text-gray-400 italic">
                                                    {t('pages.profile.balance_info')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
