"use client"

import * as React from "react"
import Image from "next/image"
import { Star, MapPin, Calendar, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Mock Data
const dentists = [
    {
        id: 1,
        name: "Dr. Sarah Wilson",
        specialty: "Cosmetic Dentist",
        rating: 4.9,
        reviews: 128,
        location: "Downtown Dental, NY",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlot: "Today, 2:00 PM",
        price: "$50",
    },
    {
        id: 2,
        name: "Dr. James Chen",
        specialty: "Orthodontist",
        rating: 5.0,
        reviews: 84,
        location: "Smile Studio, Brooklyn",
        image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlot: "Tomorrow, 9:30 AM",
        price: "$75",
    },
    {
        id: 3,
        name: "Dr. Emily Parker",
        specialty: "Pediatric Dentist",
        rating: 4.8,
        reviews: 215,
        location: "Kids Care, Queens",
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlot: "Today, 4:15 PM",
        price: "$60",
    },
    {
        id: 4,
        name: "Dr. Michael Ross",
        specialty: "Oral Surgeon",
        rating: 4.9,
        reviews: 92,
        location: "Surgical Center, NY",
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
        nextSlot: "Fri, 11:00 AM",
        price: "$100",
    },
]

export function FeaturedDentists() {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 340 // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            })
        }
    }

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                            Top-Rated Dentists
                        </h2>
                        <p className="text-gray-600">
                            Book with the most trusted specialists in your area.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll("left")}
                            className="rounded-full hover:bg-white hover:text-primary-500 hover:border-primary-200"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll("right")}
                            className="rounded-full hover:bg-white hover:text-primary-500 hover:border-primary-200"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {dentists.map((dentist) => (
                        <Card
                            key={dentist.id}
                            className="min-w-[300px] md:min-w-[340px] snap-start hover:shadow-lg transition-shadow duration-300 border-gray-100"
                        >
                            <CardContent className="p-0">
                                <div className="relative h-48 bg-gray-100">
                                    <Image
                                        src={dentist.image}
                                        alt={dentist.name}
                                        fill
                                        className="object-cover rounded-t-xl"
                                    />
                                    <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                        <Heart className="h-4 w-4" />
                                    </button>
                                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium text-gray-900">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                        {dentist.rating} ({dentist.reviews})
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="mb-4">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                                            {dentist.name}
                                        </h3>
                                        <p className="text-primary-600 text-sm font-medium mb-2">
                                            {dentist.specialty}
                                        </p>
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {dentist.location}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Next Available</span>
                                            <div className="flex items-center text-sm font-medium text-green-600">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {dentist.nextSlot}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500">Consultation</span>
                                            <p className="font-bold text-gray-900">{dentist.price}</p>
                                        </div>
                                    </div>

                                    <Button className="w-full mt-4">Book Appointment</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
