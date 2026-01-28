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
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function FiltersSidebar() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentSpecialty = searchParams.get('specialty') || ''
    const currentPrice = searchParams.get('price') || '200'
    const currentRating = searchParams.get('rating') || ''

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/search?${params.toString()}`)
    }

    const resetFilters = () => {
        router.push('/search')
    }

    return (
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <div className="flex items-center justify-between lg:hidden mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('pages.search.filters')}</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        const sidebar = document.getElementById('filters-sidebar');
                        if (sidebar) sidebar.classList.add('-translate-x-full');
                    }}
                >
                    <X className="h-6 w-6 text-gray-500" />
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="h-4 w-4" /> {t('pages.search.filters')}
                    </h3>
                    <button
                        onClick={resetFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        {t('pages.search.reset_all')}
                    </button>
                </div>

                <Accordion type="multiple" defaultValue={["specialty", "availability", "price"]} className="w-full">
                    {/* Specialty Filter */}
                    <AccordionItem value="specialty" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            {t('pages.search.specialty')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {[
                                    { key: 'featured.specialty.cosmetic', label: 'Cosmetic Dentist', value: 'Cosmetic' },
                                    { key: 'featured.specialty.orthodontist', label: 'Orthodontist', value: 'Orthodontist' },
                                    { key: 'featured.specialty.pediatric', label: 'Pediatric Dentist', value: 'Pediatric' },
                                    { key: 'featured.specialty.surgeon', label: 'Oral Surgeon', value: 'Surgeon' },
                                    { key: 'featured.specialty.general', label: 'General Dentist', value: 'General' },
                                    { key: 'featured.specialty.periodontist', label: 'Periodontist', value: 'Periodontist' }
                                ].map((specialty) => (
                                    <div key={specialty.key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={specialty.key}
                                            checked={currentSpecialty === specialty.value}
                                            onCheckedChange={(checked) => {
                                                updateFilters('specialty', checked ? specialty.value : '')
                                            }}
                                        />
                                        <Label htmlFor={specialty.key} className="text-sm font-medium text-gray-600 cursor-pointer">
                                            {t(specialty.key)}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Price Range */}
                    <AccordionItem value="price" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            {t('pages.search.price')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="pt-4 px-2">
                                <Slider
                                    defaultValue={[parseInt(currentPrice)]}
                                    max={200}
                                    step={10}
                                    className="mb-4"
                                    onValueChange={(value) => updateFilters('price', value[0].toString())}
                                />
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>€0</span>
                                    <span>€{currentPrice}+</span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Rating */}
                    <AccordionItem value="rating" className="border-b-0">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900">
                            {t('pages.search.rating')}
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3 pt-2">
                                {[
                                    { label: "4.5 & up", value: "4.5" },
                                    { label: "4.0 & up", value: "4.0" },
                                    { label: "3.5 & up", value: "3.5" }
                                ].map((rating) => (
                                    <div key={rating.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={rating.value}
                                            checked={currentRating === rating.value}
                                            onCheckedChange={(checked) => {
                                                updateFilters('rating', checked ? rating.value : '')
                                            }}
                                        />
                                        <Label htmlFor={rating.value} className="text-sm font-medium text-gray-600 cursor-pointer">
                                            {rating.label}
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
