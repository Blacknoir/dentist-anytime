"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, ShieldCheck, Share2, Heart, Clock, Award, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"

interface ProfileHeaderProps {
    dentist: any
}

export function ProfileHeader({ dentist }: ProfileHeaderProps) {
    const { t } = useLanguage()

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Cover Photo */}
            <div className="h-48 md:h-64 bg-gray-100 relative">
                <Image
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200&h=400"
                    alt="Clinic Cover"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative">
                <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 mb-8">
                    {/* Profile Photo */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
                        <Image
                            src={dentist.user.image || dentist.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300"}
                            alt={dentist.user.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-4 md:pt-16 w-full">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{dentist.user.name}</h1>
                                    <ShieldCheck className="h-6 w-6 text-primary-500" />
                                </div>
                                <p className="text-lg text-primary-600 font-medium mb-2">{dentist.specialty}</p>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-bold text-gray-900">{dentist.rating.toFixed(1)}</span>
                                        <span className="underline cursor-pointer">({dentist.reviewCount} {t('pages.search.reviews')})</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{dentist.location}</span>
                                    </div>
                                    {dentist.availability && dentist.availability.length > 0 && (
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <Clock className="h-4 w-4" />
                                            <span>Available Today</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                        <Award className="h-4 w-4 text-primary-500" />
                                        <span>{dentist.experienceYears} {t('pages.profile.years_exp')}</span>
                                    </div>
                                    {dentist._count?.bookings > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                                            <Users className="h-4 w-4 text-primary-500" />
                                            <span>{dentist._count.bookings.toLocaleString()}+ {t('pages.profile.patients')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                                <div className="flex flex-col items-center md:items-end px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 min-w-[140px]">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary-600">{t('pages.profile.consultation_fee')}</span>
                                    <span className="text-2xl font-black text-primary-700">€{dentist.priceFrom}</span>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="rounded-full">
                                        <Heart className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary-500/20 px-8" asChild>
                                    <Link href={`/booking?dentistId=${dentist.id}`}>
                                        {t('pages.profile.book_appointment')}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
