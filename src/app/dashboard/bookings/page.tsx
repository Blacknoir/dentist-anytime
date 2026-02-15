import { getDentistBookings } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { BookingPrepaymentStatus } from "@/components/dashboard/booking-prepayment-status"

export default async function BookingsPage() {
    const bookings = await getDentistBookings()

    const getStatusColor = (status: string) => {
        switch (status) {
            case "CONFIRMED": return "bg-green-50 text-green-700 border-green-100"
            case "CANCELLED": return "bg-red-50 text-red-700 border-red-100"
            case "PENDING": return "bg-yellow-50 text-yellow-700 border-yellow-100"
            default: return "bg-gray-50 text-gray-700 border-gray-100"
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "CONFIRMED": return <CheckCircle2 className="h-4 w-4" />
            case "CANCELLED": return <XCircle className="h-4 w-4" />
            case "PENDING": return <AlertCircle className="h-4 w-4" />
            default: return null
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                    <p className="text-gray-500">Manage and track all your patient bookings.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" /> Calendar View
                    </Button>
                    <Button className="gap-2">
                        Export List
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <CardTitle className="text-lg font-bold">Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Patient</th>
                                    <th className="px-6 py-4 font-semibold">Service</th>
                                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {bookings.length > 0 ? (
                                    bookings.map((booking: any) => (
                                        <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                                                        {booking.patient.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{booking.patient.name}</p>
                                                        <p className="text-xs text-gray-500">{booking.patient.email}</p>
                                                        <BookingPrepaymentStatus isPrepaid={!!booking.stripePaymentId} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 font-medium">{booking.serviceName}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                                                        {format(new Date(booking.date), 'MMM d, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {format(new Date(booking.date), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                                                    getStatusColor(booking.status)
                                                )}>
                                                    {getStatusIcon(booking.status)}
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarIcon className="h-10 w-10 text-gray-200" />
                                                <p>No bookings found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
