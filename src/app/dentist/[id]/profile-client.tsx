"use client"

import { ProfileHeader } from "@/components/dentist/profile-header"
import { ServicesList } from "@/components/dentist/services-list"
import { ReviewsSection } from "@/components/dentist/reviews-section"
import { AvailabilityCalendar } from "@/components/dentist/availability-calendar"
import { useLanguage } from "@/lib/LanguageContext"

interface ProfileClientProps {
    dentist?: any
}

export function ProfileClient({ dentist }: ProfileClientProps) {
    const { t } = useLanguage()

    return (
        <main className="pt-20 pb-20">
            <ProfileHeader dentist={dentist} />

            <div className="container mx-auto px-4 md:px-6 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Details */}
                    <div className="flex-1 space-y-8">
                        {/* About Section */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.profile.about')} {dentist?.user?.name || 'Dr. Wilson'}</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                {dentist?.about || t('pages.profile.about_text')}
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                {dentist?.education || t('pages.profile.education_text')}
                            </p>
                        </div>

                        <ServicesList services={dentist?.services} />
                        <ReviewsSection />
                    </div>

                    {/* Right Column: Booking */}
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        {/* AvailabilityCalendar is handled by ProfileClient */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Book an appointment with {dentist?.user?.name || 'Dr. Sarah Wilson'} using the availability calendar.
                            </p>
                        </div>
                    </div>
                </div>
        </main>
        </div >
    )
}
