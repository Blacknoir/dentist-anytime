"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FiltersSidebar } from "@/components/search/filters-sidebar"
import { DentistCard } from "@/components/search/dentist-card"
import { Button } from "@/components/ui/button"
import { Map, ListFilter, ChevronDown } from "lucide-react"

// Mock Data
const searchResults = [
    {
        id: 1,
        name: "Dr. Sarah Wilson",
        specialty: "Cosmetic Dentist",
        rating: 4.9,
        reviews: 128,
        location: "Downtown Dental, NY",
        distance: "0.8 mi",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlots: ["10:00 AM", "2:30 PM", "4:15 PM"],
        price: "$50",
        verified: true,
        videoConsult: true,
    },
    {
        id: 2,
        name: "Dr. James Chen",
        specialty: "Orthodontist",
        rating: 5.0,
        reviews: 84,
        location: "Smile Studio, Brooklyn",
        distance: "2.3 mi",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlots: ["Tomorrow", "Wed, 9:00 AM", "Wed, 11:30 AM"],
        price: "$75",
        verified: true,
        videoConsult: false,
    },
    {
        id: 3,
        name: "Dr. Emily Parker",
        specialty: "Pediatric Dentist",
        rating: 4.8,
        reviews: 215,
        location: "Kids Care, Queens",
        distance: "5.1 mi",
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlots: ["Today, 4:15 PM", "Tomorrow", "Thu, 10:00 AM"],
        price: "$60",
        verified: true,
        videoConsult: true,
    },
    {
        id: 4,
        name: "Dr. Michael Ross",
        specialty: "Oral Surgeon",
        rating: 4.9,
        reviews: 92,
        location: "Surgical Center, NY",
        distance: "1.5 mi",
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlots: ["Fri, 11:00 AM", "Fri, 2:00 PM", "Mon, 9:00 AM"],
        price: "$100",
        verified: true,
        videoConsult: true,
    },
]

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 md:px-6 py-8 pt-24">
                {/* Search Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dentists in New York, NY
                        </h1>
                        <p className="text-gray-500 mt-1">
                            142 results found • <span className="text-green-600 font-medium">85 available today</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="hidden md:flex">
                            <Map className="h-4 w-4 mr-2" /> Map View
                        </Button>
                        <Button variant="outline" className="flex items-center">
                            Sort by: Recommended <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <FiltersSidebar />

                    {/* Results List */}
                    <div className="flex-1 space-y-4">
                        {searchResults.map((dentist) => (
                            <DentistCard key={dentist.id} {...dentist} />
                        ))}

                        <div className="flex justify-center pt-8">
                            <Button variant="outline" size="lg">
                                Load more dentists
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
