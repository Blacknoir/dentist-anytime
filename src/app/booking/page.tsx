import { getDentistById } from "@/app/actions/dentists"
import { BookingClient } from "@/components/booking/booking-client"
import { redirect } from "next/navigation"

interface BookingPageProps {
    searchParams: { dentistId?: string }
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
    const dentistId = searchParams.dentistId

    if (!dentistId) {
        redirect("/search")
    }

    const dentist = await getDentistById(dentistId)

    if (!dentist) {
        redirect("/search")
    }

    return (
        <div className="pt-24 pb-20">
            <BookingClient dentist={dentist} />
        </div>
    )
}
