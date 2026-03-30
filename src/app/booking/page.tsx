import { getDentistById } from "@/app/actions/dentists"
import { BookingClient } from "@/components/booking/booking-client"
import { redirect } from "next/navigation"

interface BookingPageProps {
    searchParams: Promise<{ dentistId?: string; date?: string; time?: string; service?: string }>
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
    const params = await searchParams
    const dentistId = params.dentistId

    if (!dentistId) {
        redirect("/search")
    }

    const dentist = await getDentistById(dentistId)

    if (!dentist) {
        redirect("/search")
    }

    return (
        <div className="pt-24 pb-20">
            <BookingClient
                dentist={dentist}
                preselectedDate={params.date}
                preselectedTime={params.time}
                preselectedService={params.service}
            />
        </div>
    )
}
