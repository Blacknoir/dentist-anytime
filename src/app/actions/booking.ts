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

    const dentist = await prisma.dentistProfile.findUnique({
        where: { id: formData.dentistProfileId },
        select: { commissionRate: true, priceFrom: true }
    })

    const price = (dentist?.priceFrom || 50) * 100 // Use dentist's consultation fee (priceFrom) in cents
    const commissionAmount = (price * (dentist?.commissionRate || 10)) / 100 / 100 // Convert to EUR

    const booking = await prisma.booking.create({
        data: {
            patientId: session.user.id,
            dentistProfileId: formData.dentistProfileId,
            serviceName: formData.serviceName,
            date: formData.date,
            status: "CONFIRMED",
            paymentStatus: "COMPLETED",
            stripePaymentId: (formData as any).stripePaymentId,
            price: price / 100, // Store in EUR
            commissionAmount: commissionAmount
        }
    })

    revalidatePath("/booking/success")
    return booking
}
