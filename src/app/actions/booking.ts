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
        select: {
            commissionRate: true,
            priceFrom: true,
            user: { select: { email: true, name: true } }
        }
    })

    const patient = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true }
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

    const dentistEmail = dentist?.user?.email || "Unknown"
    const patientEmail = patient?.email || session?.user?.email || "Unknown"
    const bookingDateStr = formData.date.toLocaleString()

    console.log(`[EMAIL MOCK] To: ${dentistEmail}, Subject: New Booking Received, Content: You have a new booking from ${patient?.name || "Patient"} for ${formData.serviceName} on ${bookingDateStr}.`)
    console.log(`[EMAIL MOCK] To: ${patientEmail}, Subject: Booking Confirmed, Content: Your booking with ${dentist?.user?.name || "Dentist"} for ${formData.serviceName} on ${bookingDateStr} is confirmed.`)

    revalidatePath("/booking/success")
    return booking
}
