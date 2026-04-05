"use client"

import {
    Users,
    Calendar,
    Star,
    TrendingUp,
    Clock,
    MoreHorizontal,
    Search,
    Stethoscope,
    ShieldAlert,
    AlertCircle,
    CreditCard
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useLanguage } from "@/lib/LanguageContext"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"
import { BookingPrepaymentStatus } from "@/components/dashboard/booking-prepayment-status"
import { useSearchParams } from "next/navigation"

export function DashboardClient({ stats, signInWithGoogleAction, createStripeConnectAccountAction }: { stats: any, signInWithGoogleAction: any, createStripeConnectAccountAction: any }) {
    const { t } = useLanguage()
    const searchParams = useSearchParams()
    const stripeError = searchParams.get("stripe_error")

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 max-w-md text-center">
                    <p className="font-semibold">{t('dashboard.setup_required')}</p>
                    <p className="text-sm mt-1">{t('dashboard.setup_desc')}</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/settings">{t('dashboard.go_settings')}</Link>
                </Button>
            </div>
        )
    }

    if (stats.role === "DENTIST") {
        const isVerified = (stats as any).isVerified
        const isPending = (stats as any).isPendingVerification

        const cards = [
            {
                title: t('dashboard.stats.total_patients'),
                value: (stats as any).totalPatients.toLocaleString(),
                icon: Users,
                trend: t('dashboard.stats.unique_patients'),
                color: "text-blue-600",
                bg: "bg-blue-50"
            },
            {
                title: t('dashboard.stats.upcoming_bookings'),
                value: (stats as any).upcomingBookings.length,
                icon: Calendar,
                trend: t('dashboard.stats.recent_future'),
                color: "text-primary-600",
                bg: "bg-primary-50"
            },
            {
                title: t('dashboard.stats.average_rating'),
                value: (stats as any).rating.toFixed(1),
                icon: Star,
                trend: `${(stats as any).reviewCount} ${t('dashboard.stats.verified_reviews')}`,
                color: "text-yellow-600",
                bg: "bg-yellow-50"
            },
            {
                title: t('dashboard.stats.total_revenue'),
                value: `€${(stats as any).revenue.toLocaleString()}`,
                icon: TrendingUp,
                trend: t('dashboard.stats.from_confirmed'),
                color: "text-green-600",
                bg: "bg-green-50"
            }
        ]

        return (
            <div className="space-y-8">
                {/* Status Notification */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className={cn(
                        "flex-1 p-4 md:p-6 rounded-2xl border flex items-start gap-4",
                        (stats as any).todayAvailability?.isClosed
                            ? "bg-red-50 border-red-100 text-red-800"
                            : "bg-green-50 border-green-100 text-green-800 shadow-sm shadow-green-100"
                    )}>
                        <div className={cn(
                            "p-3 rounded-xl",
                            (stats as any).todayAvailability?.isClosed ? "bg-red-100" : "bg-green-100"
                        )}>
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">
                                {(stats as any).todayAvailability?.isClosed ? t('dashboard.clinic_closed') : t('dashboard.clinic_open')}
                            </h3>
                            <p className="text-sm opacity-90">
                                {(stats as any).todayAvailability?.isClosed
                                    ? t('dashboard.clinic_closed_desc')
                                    : `${t('dashboard.clinic_open_desc')} ${(stats as any).todayAvailability.startTime} ${t('dashboard.to')} ${(stats as any).todayAvailability.endTime}.`}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-auto rounded-full font-bold uppercase text-[10px] tracking-widest text-current hover:bg-current/10" asChild>
                            <Link href="/dashboard/availability">{t('dashboard.change')}</Link>
                        </Button>
                    </div>

                    {!isVerified && (
                        <div className={cn(
                            "flex-1 p-4 md:p-6 rounded-2xl border flex items-start gap-4",
                            isPending ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-red-50 border-red-100 text-red-800"
                        )}>
                            <div className={cn(
                                "p-3 rounded-xl",
                                isPending ? "bg-blue-100" : "bg-red-100"
                            )}>
                                {isPending ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">
                                    {isPending ? t('dashboard.profile_review') : t('dashboard.verification_required')}
                                </h3>
                                <p className="text-sm opacity-90 mb-3">
                                    {isPending
                                        ? t('dashboard.docs_reviewed')
                                        : t('dashboard.upload_degree')}
                                </p>
                                {!isPending && (
                                    <Button size="sm" variant="destructive" asChild className="h-8 text-xs">
                                        <Link href="/dashboard/profile">{t('dashboard.submit')}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stripe Connect Prompt */}
                {stripeError && (
                    <div className="p-4 mb-4 rounded-xl border bg-red-50 border-red-200 text-red-800 flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold">Stripe Connection Error</h3>
                            <p className="text-sm mt-1">{decodeURIComponent(stripeError)}</p>
                        </div>
                    </div>
                )}
                
                {isVerified && !(stats as any).isStripeConnected && (
                    <div className="p-4 md:p-6 rounded-2xl border bg-indigo-50 border-indigo-100 text-indigo-800 flex flex-col sm:flex-row items-start gap-4 shadow-sm shadow-indigo-100">
                        <div className="p-3 rounded-xl bg-indigo-100/50">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold">
                                    {(stats as any).stripeAccountId ? t('dashboard.complete_payment') : t('dashboard.setup_payment')}
                                </h3>
                                {(stats as any).stripeAccountId && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900 uppercase">{t('dashboard.in_progress')}</span>
                                )}
                            </div>
                            <p className="text-sm opacity-90 mb-4">
                                {(stats as any).stripeAccountId
                                    ? t('dashboard.stripe_incomplete')
                                    : t('dashboard.stripe_required')}
                            </p>
                            <form action={createStripeConnectAccountAction}>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md shadow-indigo-200">
                                    {(stats as any).stripeAccountId ? t('dashboard.resume_stripe') : t('dashboard.connect_stripe')}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.dentist_dashboard')}</h1>
                    <p className="text-gray-500">{t('dashboard.welcome_dentist')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card) => (
                        <Card key={card.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("p-2 rounded-lg", card.bg)}>
                                        <card.icon className={cn("h-6 w-6", card.color)} />
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{card.value}</h3>
                                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                        {card.trend}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-2 border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">{t('dashboard.upcoming_appointments')}</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/bookings">{t('dashboard.view_all')}</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {(stats as any).upcomingBookings.length > 0 ? (
                                    (stats as any).upcomingBookings.map((booking: any) => (
                                        <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0">
                                                    {booking.patient.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1">{booking.patient.name}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-1">{booking.serviceName}</p>
                                                    <BookingPrepaymentStatus isPrepaid={!!booking.stripePaymentId} />
                                                </div>
                                            </div>
                                            <div className="sm:text-right w-full sm:w-auto pl-14 sm:pl-0">
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                    <Clock className="h-4 w-4 text-primary-500" />
                                                    {format(new Date(booking.date), 'HH:mm')}
                                                </div>
                                                <p className="text-xs text-gray-400">{format(new Date(booking.date), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        {t('dashboard.no_upcoming')}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">{t('dashboard.quick_actions')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start gap-3" variant="outline" asChild>
                                <Link href="/dashboard/availability">
                                    <Calendar className="h-4 w-4" />
                                    {t('dashboard.update_availability')}
                                </Link>
                            </Button>
                            <Button className="w-full justify-start gap-3" variant="outline" asChild>
                                <Link href="/dashboard/services">
                                    <Users className="h-4 w-4" />
                                    {t('dashboard.manage_services')}
                                </Link>
                            </Button>
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <Star className="h-4 w-4" />
                                {t('dashboard.view_reviews')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Patient Dashboard UI
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.my_dashboard')}</h1>
                <p className="text-gray-500">{t('dashboard.patient_welcome')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{t('dashboard.upcoming')}</p>
                                <h3 className="text-xl font-bold text-gray-900">{(stats as any).upcomingBookings.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{t('dashboard.completed')}</p>
                                <h3 className="text-xl font-bold text-gray-900">{(stats as any).completedBookings.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-primary-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Stethoscope className="h-32 w-32" />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="max-w-md">
                        <h2 className="text-2xl font-bold mb-2">{t('dashboard.are_you_dentist')}</h2>
                        <p className="text-primary-100 mb-6">{t('dashboard.dentist_promo')}</p>
                        <form action={signInWithGoogleAction}>
                            <Button className="bg-white text-primary-900 hover:bg-primary-50">
                                {t('dashboard.switch_dentist')}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold">{t('dashboard.upcoming_appointments')}</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/search">{t('dashboard.find_new_dentist')}</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {(stats as any).upcomingBookings.length > 0 ? (
                            (stats as any).upcomingBookings.map((booking: any) => (
                                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-100 transition-colors gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                            <img src={booking.dentistProfile.image || "/dentist-placeholder.png"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 line-clamp-1">{booking.dentistProfile.user.name}</p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{booking.serviceName}</p>
                                        </div>
                                    </div>
                                    <div className="sm:text-right w-full sm:w-auto pl-16 sm:pl-0">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-primary-600">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(booking.date), 'MMM d, yyyy @ HH:mm')}
                                        </div>
                                        {booking.stripePaymentId && (
                                            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 w-fit ml-auto">
                                                €50 {t('dashboard.prepaid')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">{t('dashboard.no_upcoming_patient')}</p>
                                <Button className="mt-4" asChild>
                                    <Link href="/search">{t('dashboard.book_first')}</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
