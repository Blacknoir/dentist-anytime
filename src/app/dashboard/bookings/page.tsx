import { getDentistBookings } from "@/app/actions/dashboard"
import { BookingsClient } from "@/components/dashboard/bookings-client"

export default async function BookingsPage() {
    const bookings = await getDentistBookings()
    return <BookingsClient bookings={bookings} />
}

