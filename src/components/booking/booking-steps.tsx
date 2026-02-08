"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

interface BookingStepsProps {
    currentStep: number
}

export function BookingSteps({ currentStep }: BookingStepsProps) {
    const { t } = useLanguage()

    const steps = [
        { id: 1, name: t('pages.booking.step1') },
        { id: 2, name: t('pages.booking.step2') },
        { id: 3, name: t('pages.booking.step3') },
        { id: 4, name: t('pages.booking.step4') },
        { id: 5, name: "Payment" },
    ]

    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > step.id
                    const isCurrent = currentStep === step.id

                    return (
                        <React.Fragment key={step.id}>
                            {/* Step Circle */}
                            <div className="flex flex-col items-center relative">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${isCompleted || isCurrent
                                        ? "bg-primary-500 text-white"
                                        : "bg-gray-100 text-gray-400"
                                        }`}
                                >
                                    {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                </div>
                                <span
                                    className={`absolute top-10 text-[10px] md:text-xs font-medium whitespace-nowrap hidden sm:block ${isCompleted || isCurrent ? "text-primary-600" : "text-gray-400"
                                        }`}
                                >
                                    {step.name}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`w-12 md:w-24 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? "bg-primary-500" : "bg-gray-100"
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
