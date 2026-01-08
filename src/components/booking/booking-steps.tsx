"use client"

import * as React from "react"
import { Check } from "lucide-react"

interface BookingStepsProps {
    currentStep: number
}

const steps = [
    { id: 1, name: "Service" },
    { id: 2, name: "Time" },
    { id: 3, name: "Details" },
    { id: 4, name: "Confirm" },
]

export function BookingSteps({ currentStep }: BookingStepsProps) {
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
                                    className={`absolute top-10 text-xs font-medium whitespace-nowrap ${isCompleted || isCurrent ? "text-primary-600" : "text-gray-400"
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
