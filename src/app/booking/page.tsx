import { getDentistById } from "@/app/actions/dentists"
import { BookingClient } from "@/components/booking/booking-client"
import { buildAppointmentDate, isSlotAvailable } from "@/lib/availability"
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

    // Κράτηση επιτρέπεται μόνο για ώρα που υπάρχει στο πρόγραμμα του οδοντίατρου.
    const dateKey = params.date
    const time = params.time

    if (!dateKey || !time) {
        redirect(`/dentist/${dentistId}`)
    }

    const appointmentDate = buildAppointmentDate(dateKey, time)

    if (!appointmentDate || !isSlotAvailable(dentist, appointmentDate, time)) {
        redirect(`/dentist/${dentistId}`)
    }

    return (
        <div className="pt-24 pb-20">
            <BookingClient
                dentist={dentist}
                preselectedDate={dateKey}
                preselectedTime={time}
                preselectedService={params.service}
            />
        </div>
    )
}
