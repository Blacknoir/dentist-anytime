"use client"

import { Check, Info } from "lucide-react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const services = [
    {
        category: "Consultations",
        items: [
            { name: "Initial Consultation", price: "$50", duration: "30 min" },
            { name: "Video Consultation", price: "$40", duration: "20 min" },
        ],
    },
    {
        category: "Preventive Care",
        items: [
            { name: "Dental Cleaning", price: "$120", duration: "45 min" },
            { name: "Fluoride Treatment", price: "$40", duration: "15 min" },
            { name: "Dental Sealants", price: "$60", duration: "30 min" },
        ],
    },
    {
        category: "Cosmetic Dentistry",
        items: [
            { name: "Teeth Whitening", price: "$350", duration: "60 min" },
            { name: "Porcelain Veneers", price: "$900", duration: "90 min" },
            { name: "Invisalign Consultation", price: "Free", duration: "30 min" },
        ],
    },
]

export function ServicesList() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Services & Pricing</h2>

            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                {services.map((category, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b-0 mb-2">
                        <AccordionTrigger className="hover:no-underline bg-gray-50 px-4 rounded-lg text-gray-900 font-semibold">
                            {category.category}
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-4">
                            <div className="space-y-4">
                                {category.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <Info className="h-4 w-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="text-sm text-gray-500">{item.duration}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-bold text-gray-900">{item.price}</span>
                                            <Button size="sm" variant="outline" className="h-8">
                                                Book
                                            </Button>
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
