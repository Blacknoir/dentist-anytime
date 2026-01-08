"use client"

import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion"
import { Filter, X } from "lucide-react"

export function FiltersSidebar() {
    return (
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between lg:hidden mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-2" /> Close
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filters
                    </h3>
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                        Reset all
                    </button>
                </div>

                <Accordion type="multiple" defaultValue={["specialty", "availability", "price"]} className="w-full">
                    {/* Specialty Filter */}
                    <AccordionItem value="specialty" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            Specialty
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {[
                                    "General Dentist",
                                    "Orthodontist",
                                    "Cosmetic Dentist",
                                    "Pediatric Dentist",
                                    "Oral Surgeon",
                                    "Periodontist"
                                ].map((specialty) => (
                                    <div key={specialty} className="flex items-center space-x-2">
                                        <Checkbox id={specialty} />
                                        <Label htmlFor={specialty} className="text-sm font-medium text-gray-600 cursor-pointer">
                                            {specialty}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Availability Filter */}
                    <AccordionItem value="availability" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            Availability
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {[
                                    "Today",
                                    "Tomorrow",
                                    "This Week",
                                    "Weekends"
                                ].map((time) => (
                                    <div key={time} className="flex items-center space-x-2">
                                        <Checkbox id={time} />
                                        <Label htmlFor={time} className="text-sm font-medium text-gray-600 cursor-pointer">
                                            {time}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Price Range */}
                    <AccordionItem value="price" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            Consultation Price
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-4 px-2">
                                <Slider defaultValue={[50]} max={200} step={10} className="mb-4" />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>$0</span>
                                    <span>$200+</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Rating */}
                    <AccordionItem value="rating" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            Rating
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {[
                                    "4.5 & up",
                                    "4.0 & up",
                                    "3.5 & up"
                                ].map((rating) => (
                                    <div key={rating} className="flex items-center space-x-2">
                                        <Checkbox id={rating} />
                                        <Label htmlFor={rating} className="text-sm font-medium text-gray-600 cursor-pointer">
                                            {rating}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    )
}
