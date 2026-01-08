"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepServiceProps {
    selectedService: string | null
    onSelect: (service: string) => void
}

const services = [
    { id: "checkup", name: "Dental Checkup", price: "$50", duration: "30 min" },
    { id: "cleaning", name: "Teeth Cleaning", price: "$120", duration: "45 min" },
    { id: "whitening", name: "Teeth Whitening", price: "$350", duration: "60 min" },
    { id: "emergency", name: "Emergency Exam", price: "$80", duration: "30 min" },
]

export function StepService({ selectedService, onSelect }: StepServiceProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Service</h2>
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
