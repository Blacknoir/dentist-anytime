"use client"

import Link from "next/link"
import { CheckCircle2, Calendar, Clock, MapPin, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { useLanguage } from "@/lib/LanguageContext"

export default function BookingSuccessPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center p-4 md:p-6 pt-24 pb-12">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-primary-500/5 border border-gray-100 p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('pages.booking.success_title')}
                    </h1>
                    <p className="text-gray-500 mb-8">
                        {t('pages.booking.success_desc')}
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('pages.booking.date')}</p>
                                <p className="font-semibold text-gray-900">Wednesday, Oct 14, 2024</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary-500 mt-0.5" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('pages.booking.time')}</p>
                                <p className="font-semibold text-gray-900">10:00 AM</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button className="w-full" size="lg" asChild>
                            <Link href="/dashboard/bookings">
                                {t('pages.booking.view_appointments')} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full" asChild>
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" /> {t('pages.return_home')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
