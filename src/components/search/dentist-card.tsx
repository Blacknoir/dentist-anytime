"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Clock, Heart, ShieldCheck, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/LanguageContext"

interface DentistCardProps {
    id: string
    name: string
    specialty: string
    rating: number
    reviews: number
    location: string
    image: string
    nextSlots: string[]
    price: string
    verified?: boolean
    distance?: number | null
}

export function DentistCard({
    id,
    name,
    specialty,
    rating,
    reviews,
    location,
    image,
    nextSlots,
    price,
    verified = true,
    distance = null
}: DentistCardProps) {
    const { t } = useLanguage()

    return (
        <Link href={`/dentist/${id}`} className="block group">
            <Card className="hover:shadow-md transition-all duration-300 border-gray-100 overflow-hidden group-hover:border-primary-100">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                    {/* Image Section */}
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
                        <Image
                            src={image}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors sm:hidden z-10"
                        >
                            <Heart className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{name}</h3>
                                    {verified && (
                                        <ShieldCheck className="h-4 w-4 text-primary-500" />
                                    )}
                                </div>
                                <p className="text-primary-600 font-medium text-sm mb-2">{specialty}</p>

                                <div className="flex flex-col gap-1 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold text-gray-900">{rating}</span>
                                            <span>({reviews} {t('pages.search.reviews')})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{location}</span>
                                        </div>
                                    </div>
                                    {distance !== null && (
                                        <div className="flex items-center gap-1 text-primary-600 font-bold">
                                            <Navigation className="h-3 w-3 fill-primary-600" />
                                            <span>{distance.toFixed(1)} km {t('pages.search.near_me')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {t('pages.search.next_available')}: {t('featured.slot.today')}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden sm:block text-right">
                                <p className="text-xs text-gray-500 mb-1">{t('pages.search.from')}</p>
                                <p className="text-xl font-bold text-gray-900">{price}</p>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    className="mt-2 p-2 text-gray-400 hover:text-red-500 transition-colors z-10"
                                >
                                    <Heart className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Booking Slots */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-100">
                            <div className="flex-1 w-full flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                                {nextSlots.map((slot, index) => (
                                    <div
                                        key={index}
                                        className="flex-shrink-0 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                    >
                                        {slot}
                                    </div>
                                ))}
                            </div>
                            <div className="w-full sm:w-auto flex gap-3 items-center sm:hidden justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{t('pages.search.from')}</p>
                                    <p className="text-lg font-bold text-gray-900">{price}</p>
                                </div>
                                <Button asChild>
                                    <span>{t('pages.search.book_now')}</span>
                                </Button>
                            </div>
                            <Button asChild className="hidden sm:flex shadow-sm group-hover:shadow-md transition-all">
                                <span>{t('pages.search.book_now')}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
