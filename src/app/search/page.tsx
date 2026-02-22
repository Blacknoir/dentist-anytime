import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getDentists } from "@/app/actions/dentists"
import { SearchClient } from "./search-client"

export const dynamic = 'force-dynamic'

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; specialty?: string; price?: string; rating?: string; lat?: string; lng?: string; location?: string; radius?: string }>
}) {
    const { q: query, specialty, price, rating, lat, lng, location, radius } = await searchParams
    const dentists = await getDentists(
        query,
        specialty,
        price ? parseInt(price) : undefined,
        rating ? parseFloat(rating) : undefined,
        lat ? parseFloat(lat) : undefined,
        lng ? parseFloat(lng) : undefined,
        location,
        radius ? parseInt(radius) : 50 // Default 50km if searching by location
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            }>
                <SearchClient initialDentists={dentists} />
            </React.Suspense>
            <Footer />
        </div>
    )
}
