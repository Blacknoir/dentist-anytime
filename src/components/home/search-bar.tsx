"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"
import { LocationAutocomplete } from "@/components/search/location-autocomplete"

export function SearchBar() {
    const [location, setLocation] = React.useState("")
    const { t } = useLanguage()
    const router = useRouter()

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (location) params.set('location', location)
        router.push(`/search?${params.toString()}`)
    }

    const handleLocationSelect = async (place: { place_id: string; description: string }) => {
        setLocation(place.description)

        try {
            const response = await fetch(`/api/places/details?placeId=${place.place_id}`)
            if (response.ok) {
                const details = await response.json()
                const params = new URLSearchParams()
                params.set('location', details.city || place.description)
                params.set('lat', details.lat.toString())
                params.set('lng', details.lng.toString())
                router.push(`/search?${params.toString()}`)
            }
        } catch (error) {
            console.error('Error fetching place details:', error)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="p-2 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4 items-stretch">
                <div className="flex-1">
                    <LocationAutocomplete
                        value={location}
                        onChange={setLocation}
                        onSelect={handleLocationSelect}
                        placeholder={t('search.placeholder_location')}
                    />
                </div>

                <Button
                    onClick={handleSearch}
                    size="lg"
                    className="h-12 px-8 text-base shadow-lg shadow-primary-500/20 gap-2"
                >
                    <Search className="h-4 w-4" />
                    {t('search.button')}
                </Button>
            </div>
        </div>
    )
}
