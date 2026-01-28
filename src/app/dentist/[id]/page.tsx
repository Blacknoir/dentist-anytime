import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProfileClient } from "./profile-client"

export default function DentistProfilePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-20 pb-20">
                <ProfileClient />

                <div className="container mx-auto px-4 md:px-6 mt-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Details */}
                        <div className="flex-1 space-y-8">
                            {/* About Section */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">About Dr. Wilson</h2>
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Dr. Sarah Wilson is a highly skilled Cosmetic Dentist with over 15 years of experience transforming smiles.
                                    She specializes in veneers, teeth whitening, and full mouth reconstructions. Dr. Wilson is known for her
                                    gentle approach and attention to detail, ensuring every patient leaves with a confident smile.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    She received her DDS from New York University College of Dentistry and completed her residency at
                                    Mount Sinai Hospital. She is an active member of the American Academy of Cosmetic Dentistry.
                                </p>
                            </div>

                            {/* Services and Reviews are handled by ProfileClient */}
                        </div>

                        {/* Right Column: Booking */}
                        <div className="w-full lg:w-[400px] flex-shrink-0">
                            {/* AvailabilityCalendar is handled by ProfileClient */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Availability</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    Book an appointment with Dr. Sarah Wilson using the availability calendar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
