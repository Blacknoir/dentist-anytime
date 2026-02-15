import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getDentists } from "@/app/actions/dentists"
import { SearchClient } from "./search-client"

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; specialty?: string; price?: string; rating?: string; lat?: string; lng?: string }>
}) {
    const { q: query, specialty, price, rating, lat, lng } = await searchParams
    const dentists = await getDentists(
        query,
        specialty,
        price ? parseInt(price) : undefined,
        rating ? parseFloat(rating) : undefined,
        lat ? parseFloat(lat) : undefined,
        lng ? parseFloat(lng) : undefined
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <SearchClient initialDentists={dentists} />
            <Footer />
        </div>
    )
}
