"use client"

import * as React from "react"
import { FiltersSidebar } from "@/components/search/filters-sidebar"
import { DentistCard } from "@/components/search/dentist-card"
import { GoogleMap } from "@/components/search/google-map"
import { Button } from "@/components/ui/button"
import { Map, ChevronDown, Filter, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"
import { useRouter, useSearchParams } from "next/navigation"

interface SearchClientProps {
    initialDentists: any[]
}

export function SearchClient({ initialDentists }: SearchClientProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showMapView, setShowMapView] = React.useState(false)

    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const searchCenter = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined

    const formatTime = (time: string) => {
        return time.replace("AM", t('time.am')).replace("PM", t('time.pm'))
    }

    const dentists = (initialDentists || []).map(d => ({
        id: d.id,
        name: d.user.name,
        specialty: d.specialty,
        rating: d.rating,
        reviews: d.reviewCount,
        location: d.location,
        image: d.user.image || d.image || "/dentist-placeholder.png",
        nextSlots: d.availability.length > 0
            ? d.availability.slice(0, 3).map((a: any) => formatTime(a.startTime))
            : [],
        price: `€${d.priceFrom}`,
        distance: d.distance,
        latitude: d.latitude,
        longitude: d.longitude
    }))

    return (
        <main className="flex-1 container mx-auto px-4 md:px-6 py-8 pt-24">
            {/* Search Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('pages.search.title')}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {dentists.length} {t('pages.search.results_found')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant={showMapView ? "default" : "outline"}
                        className="hidden md:flex"
                        onClick={() => setShowMapView(!showMapView)}
                    >
                        <Map className="h-4 w-4 mr-2" /> {t('pages.search.map_view')}
                    </Button>
                    <Button variant="outline" className="flex items-center">
                        {t('pages.search.sort_by')}: {t('pages.search.recommended')} <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Mobile Filter Toggle */}
                <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 mb-4 sticky top-[72px] z-30 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">{dentists.length} {t('pages.search.results_found')}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const sidebar = document.getElementById('filters-sidebar');
                            if (sidebar) sidebar.classList.toggle('-translate-x-full');
                        }}
                        className="gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        {t('pages.search.filters')}
                    </Button>
                </div>

                {/* Sidebar */}
                <div
                    id="filters-sidebar"
                    className="fixed inset-y-0 left-0 w-[280px] bg-white z-[60] lg:relative lg:inset-auto lg:w-80 transition-transform duration-300 -translate-x-full lg:translate-x-0 overflow-y-auto lg:overflow-visible shadow-2xl lg:shadow-none p-6 lg:p-0"
                >
                    <FiltersSidebar />
                </div>

                {/* Results List */}
                <div className="flex-1 space-y-4">
                    {showMapView ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-4">{t('pages.search.map_view')}</h3>
                            <GoogleMap
                                dentists={dentists.filter(d => d.latitude && d.longitude)}
                                center={searchCenter}
                                onDentistClick={(dentist) => {
                                    // Scroll to dentist card when marker is clicked
                                    const card = document.getElementById(`dentist-card-${dentist.id}`)
                                    if (card) {
                                        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                        card.classList.add('ring-2', 'ring-primary-500')
                                        setTimeout(() => card.classList.remove('ring-2', 'ring-primary-500'), 2000)
                                    }
                                }}
                            />
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dentists.map((dentist: any) => (
                                    <div key={dentist.id} id={`dentist-card-${dentist.id}`} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="h-4 w-4 text-primary-500" />
                                            <span className="font-medium text-gray-900">{dentist.name}</span>
                                        </div>
                                        <p className="text-sm text-gray-600">{dentist.location}</p>
                                        {dentist.distance !== null && dentist.distance !== undefined && (
                                            <p className="text-sm text-primary-600 font-medium mt-1">
                                                {dentist.distance.toFixed(1)} km away
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : dentists.length > 0 ? (
                        <>
                            {dentists.map((dentist: any) => (
                                <DentistCard
                                    key={dentist.id}
                                    id={dentist.id}
                                    name={dentist.name}
                                    specialty={dentist.specialty}
                                    rating={dentist.rating}
                                    reviews={dentist.reviews}
                                    location={dentist.location}
                                    image={dentist.image}
                                    nextSlots={dentist.nextSlots}
                                    price={dentist.price}
                                    distance={dentist.distance}
                                />
                            ))}

                            <div className="flex justify-center pt-8">
                                <Button variant="outline" size="lg">
                                    {t('pages.search.load_more')}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('pages.search.no_results')}</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">
                                {t('pages.search.no_results_desc')}
                            </p>
                            <Button
                                variant="link"
                                onClick={() => router.push('/search')}
                                className="mt-4 text-primary-600"
                            >
                                {t('pages.search.clear_all_filters')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
