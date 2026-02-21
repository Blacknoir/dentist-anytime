"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/LanguageContext"
import { LocationAutocomplete } from "@/components/search/location-autocomplete"

export function SearchBar() {
    const [activeTab, setActiveTab] = React.useState<"doctor" | "service">("doctor")
    const [query, setQuery] = React.useState("")
    const [location, setLocation] = React.useState("")
    const { t } = useLanguage()
    const router = useRouter()

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (location) params.set('location', location)
        router.push(`/search?${params.toString()}`)
    }

    const handleLocationSelect = async (place: { place_id: string; description: string }) => {
        setLocation(place.description)

        try {
            const response = await fetch(`/api/places/details?placeId=${place.place_id}`)
            if (response.ok) {
                const coords = await response.json()
                const params = new URLSearchParams()
                if (query) params.set('q', query)
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
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100">
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("doctor")}
                    className={cn(
                        "flex-1 py-4 text-sm font-medium transition-colors relative rounded-tl-2xl",
                        activeTab === "doctor"
                            ? "text-primary-600 bg-primary-50/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                >
                    {t('search.find_dentist')}
                    {activeTab === "doctor" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("service")}
                    className={cn(
                        "flex-1 py-4 text-sm font-medium transition-colors relative rounded-tr-2xl",
                        activeTab === "service"
                            ? "text-primary-600 bg-primary-50/50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                >
                    {t('search.find_service')}
                    {activeTab === "service" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                    )}
                </button>
            </div>

            {/* Search Inputs */}
            <div className="p-2 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={
                            activeTab === "doctor"
                                ? t('search.placeholder_doctor')
                                : t('search.placeholder_service')
                        }
                        className="pl-10 h-12 border-gray-200 bg-white focus:bg-white transition-colors !text-gray-900 placeholder:text-gray-500"
                    />
                </div>

                <div className="flex-1">
                    <LocationAutocomplete
                        value={location}
                        onChange={setLocation}
                        onSelect={handleLocationSelect}
                        placeholder={t('search.placeholder_location')}
                    />
                </div>

                <div className="md:w-48 relative group hidden md:block">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    <Input
                        placeholder={t('search.placeholder_date')}
                        className="pl-10 h-12 border-gray-200 bg-white focus:bg-white transition-colors !text-gray-900 placeholder:text-gray-500"
                    />
                </div>

                <Button
                    onClick={handleSearch}
                    size="lg"
                    className="h-12 px-8 text-base shadow-lg shadow-primary-500/20"
                >
                    {t('search.button')}
                </Button>
            </div>
        </div>
    )
}
