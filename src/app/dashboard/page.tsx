import { getDashboardStats } from "@/app/actions/dashboard"
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
    AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { signInWithGoogle } from "@/app/actions/auth"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 max-w-md text-center">
                    <p className="font-semibold">Account Setup Required</p>
                    <p className="text-sm mt-1">Please complete your profile configuration to access all dashboard features.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/settings">Go to Settings</Link>
                </Button>
            </div>
        )
    }

    if (stats.role === "DENTIST") {
        const isVerified = (stats as any).isVerified
        const isPending = (stats as any).isPendingVerification

        const cards = [
            {
                title: "Total Patients",
                value: (stats as any).totalPatients.toLocaleString(),
                icon: Users,
                trend: "+12% from last month",
                color: "text-blue-600",
                bg: "bg-blue-50"
            },
            {
                title: "Upcoming Bookings",
                value: (stats as any).upcomingBookings.length,
                icon: Calendar,
                trend: "4 new today",
                color: "text-primary-600",
                bg: "bg-primary-50"
            },
            {
                title: "Average Rating",
                value: (stats as any).rating.toFixed(1),
                icon: Star,
                trend: `${(stats as any).reviewCount} total reviews`,
                color: "text-yellow-600",
                bg: "bg-yellow-50"
            },
            {
                title: "Monthly Revenue",
                value: `€${(stats as any).revenue.toLocaleString()}`,
                icon: TrendingUp,
                trend: "+8% from last month",
                color: "text-green-600",
                bg: "bg-green-50"
            }
        ]

        return (
            <div className="space-y-8">
                {!isVerified && (
                    <div className={cn(
                        "p-4 md:p-6 rounded-2xl border flex flex-col sm:flex-row items-start gap-4",
                        isPending ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-red-50 border-red-100 text-red-800"
                    )}>
                        <div className={cn(
                            "p-3 rounded-xl",
                            isPending ? "bg-blue-100" : "bg-red-100"
                        )}>
                            {isPending ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">
                                {isPending ? "Profile Under Review" : "Verification Required"}
                            </h3>
                            <p className="text-sm opacity-90 mb-4">
                                {isPending
                                    ? "Your verification documents are being reviewed. Your profile will be visible to patients once approved."
                                    : "To start receiving bookings, you must upload your professional degree for verification."}
                            </p>
                            {!isPending && (
                                <Button size="sm" variant="destructive" asChild>
                                    <Link href="/dashboard/profile">Submit Verification</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dentist Dashboard</h1>
                    <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
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
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                        {card.trend}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Analytics Insights */}
                <AnalyticsDashboard />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upcoming Appointments */}
                    <Card className="lg:col-span-2 border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Upcoming Appointments</CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/dashboard/bookings">View All</Link>
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
                                        No upcoming appointments found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start gap-3" variant="outline" asChild>
                                <Link href="/dashboard/availability">
                                    <Calendar className="h-4 w-4" />
                                    Update Availability
                                </Link>
                            </Button>
                            <Button className="w-full justify-start gap-3" variant="outline" asChild>
                                <Link href="/dashboard/services">
                                    <Users className="h-4 w-4" />
                                    Manage Services
                                </Link>
                            </Button>
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <Star className="h-4 w-4" />
                                View All Reviews
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
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-500">Keep track of your dental health and appointments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Upcoming</p>
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
                                <p className="text-sm text-gray-500">Completed</p>
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
                        <h2 className="text-2xl font-bold mb-2">Are you a Dentist?</h2>
                        <p className="text-primary-100 mb-6">Create your professional profile, manage appointments, and grow your practice with Dentist Anytime.</p>
                        <form action={signInWithGoogle.bind(null, "DENTIST")}>
                            <Button className="bg-white text-primary-900 hover:bg-primary-50">
                                Switch to Dentist Account
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold">Upcoming Appointments</CardTitle>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/search">Find New Dentist</Link>
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
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No upcoming appointments found.</p>
                                <Button className="mt-4" asChild>
                                    <Link href="/search">Book Your First Appointment</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
