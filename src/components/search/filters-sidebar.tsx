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
import { LocationAutocomplete } from "@/components/search/location-autocomplete"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, X, Navigation, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import { cn } from "@/lib/utils"

export function FiltersSidebar() {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLocating, setIsLocating] = React.useState(false)
    const [locationInput, setLocationInput] = React.useState('')

    const currentSpecialty = searchParams.get('specialty') || ''
    const currentPrice = searchParams.get('price') || '200'
    const currentRating = searchParams.get('rating') || ''
    const currentLat = searchParams.get('lat')
    const currentLng = searchParams.get('lng')
    const currentLocation = searchParams.get('location') || ''

    // Sync local input with URL
    React.useEffect(() => {
        if (currentLocation) {
            setLocationInput(currentLocation)
        }
    }, [currentLocation])

    const updateFilters = (key: string, value: string | null) => {
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

    const handleNearMe = () => {
        if (currentLat && currentLng) {
            // If already active, toggle off
            const params = new URLSearchParams(searchParams.toString())
            params.delete('lat')
            params.delete('lng')
            router.push(`/search?${params.toString()}`)
            return
        }

        setIsLocating(true)
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const params = new URLSearchParams(searchParams.toString())
                    params.set('lat', position.coords.latitude.toString())
                    params.set('lng', position.coords.longitude.toString())
                    router.push(`/search?${params.toString()}`)
                    setIsLocating(false)
                },
                (error) => {
                    console.error("Geolocation error:", error)
                    setIsLocating(false)
                    alert("Could not get your location. Please ensure location access is granted.")
                },
                { enableHighAccuracy: true }
            )
        } else {
            setIsLocating(false)
            alert("Geolocation is not supported by your browser.")
        }
    }

    const handleLocationSelect = async (place: { place_id: string; description: string }) => {
        setLocationInput(place.description)
        try {
            const response = await fetch(`/api/places/details?placeId=${place.place_id}`)
            if (response.ok) {
                const coords = await response.json()
                const params = new URLSearchParams(searchParams.toString())
                params.set('location', place.description)
                params.set('lat', coords.lat.toString())
                params.set('lng', coords.lng.toString())
                router.push(`/search?${params.toString()}`)
            }
        } catch (error) {
            console.error('Error fetching place details:', error)
        }
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

                {/* Near Me Button */}
                <Button
                    variant={currentLat ? "default" : "outline"}
                    className={cn(
                        "w-full mb-4 gap-2 font-bold",
                        currentLat ? "bg-primary-600 hover:bg-primary-700" : ""
                    )}
                    onClick={handleNearMe}
                    disabled={isLocating}
                >
                    {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Navigation className={cn("h-4 w-4", currentLat ? "fill-white" : "")} />
                    )}
                    {isLocating ? t('pages.search.locating') : t('pages.search.near_me')}
                </Button>

                {/* Location Autocomplete */}
                <div className="mb-6">
                    <LocationAutocomplete
                        value={locationInput}
                        onChange={setLocationInput}
                        onSelect={handleLocationSelect}
                        placeholder={t('pages.search.location_placeholder') || "Enter city or location"}
                    />
                </div>

                <Accordion type="multiple" defaultValue={["specialty", "availability", "price"]} className="w-full">
                    {/* Specialty Filter */}
                    <AccordionItem value="specialty" className="border-b-0 mb-4">
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900 text-left">
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
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900 text-left">
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
                        <AccordionTrigger className="hover:no-underline py-2 text-sm font-semibold text-gray-900 text-left">
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
