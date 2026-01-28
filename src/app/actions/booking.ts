"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createBooking(formData: {
    dentistProfileId: string
    serviceName: string
    date: Date
}) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("You must be logged in to book an appointment")
    }

    const booking = await prisma.booking.create({
        data: {
            patientId: session.user.id,
            dentistProfileId: formData.dentistProfileId,
            serviceName: formData.serviceName,
            date: formData.date,
            status: "PENDING"
        }
    })

    revalidatePath("/booking/success")
    return booking
}
