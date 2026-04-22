"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { stripe } from "@/lib/stripe"

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
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/bookings")
    return booking
}

export async function cancelBooking(bookingId: string) {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("You must be logged in to cancel a booking")
    }

    // Find the booking and verify it belongs to the current user
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            dentistProfile: true
        }
    })

    if (!booking) {
        throw new Error("Booking not found")
    }

    if (booking.patientId !== session.user.id) {
        throw new Error("You can only cancel your own bookings")
    }

    if (booking.status === "CANCELLED") {
        throw new Error("This booking is already cancelled")
    }

    // Check if the booking is at least 3 days away
    const bookingDate = new Date(booking.date)
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    if (bookingDate <= threeDaysFromNow) {
        throw new Error("CANCEL_TOO_LATE")
    }

    let refundAmount = 0
    let stripeFee = 0
    let refundedSuccessfully = false

    // Process Stripe refund if there's a payment
    if (booking.stripePaymentId) {
        try {
            // Retrieve the payment intent with expanded charge and balance transaction
            const paymentIntent = await stripe.paymentIntents.retrieve(
                booking.stripePaymentId,
                { expand: ['latest_charge.balance_transaction'] }
            )

            const charge = paymentIntent.latest_charge as any
            
            if (charge && charge.balance_transaction) {
                const balanceTransaction = charge.balance_transaction as any
                
                // Find the Stripe processing fee (not the application fee)
                const stripeProcessingFee = balanceTransaction.fee_details?.find(
                    (f: any) => f.type === 'stripe_fee'
                )
                
                stripeFee = stripeProcessingFee ? stripeProcessingFee.amount : 0 // in cents
                
                // Refund amount = total charge minus Stripe processing fee
                // Stripe keeps its processing fee, so we pass that cost to the refund
                const totalAmountCents = paymentIntent.amount
                const refundAmountCents = totalAmountCents - stripeFee
                
                if (refundAmountCents > 0) {
                    // Create partial refund (minus Stripe fee) and also refund the application fee
                    await stripe.refunds.create({
                        payment_intent: booking.stripePaymentId,
                        amount: refundAmountCents,
                        refund_application_fee: true,
                    })
                    
                    refundAmount = refundAmountCents / 100 // Convert to EUR
                    refundedSuccessfully = true
                }
            } else {
                // If we can't get fee details, refund the full amount minus a small buffer
                // This shouldn't happen normally
                const totalAmountCents = paymentIntent.amount
                await stripe.refunds.create({
                    payment_intent: booking.stripePaymentId,
                    amount: totalAmountCents,
                    refund_application_fee: true,
                })
                refundAmount = totalAmountCents / 100
                refundedSuccessfully = true
            }
        } catch (error: any) {
            console.error("Stripe refund error:", error)
            throw new Error(`Refund failed: ${error.message}`)
        }
    }

    // Update booking status
    await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: "CANCELLED",
            paymentStatus: refundedSuccessfully ? "REFUNDED" : booking.paymentStatus,
        }
    })

    // Update dentist earnings (subtract the amount that was previously added)
    if (refundedSuccessfully && booking.dentistProfile) {
        const commissionRate = booking.dentistProfile.commissionRate || 10
        const dentistEarnings = booking.price - (booking.price * commissionRate / 100)
        
        await prisma.dentistProfile.update({
            where: { id: booking.dentistProfile.id },
            data: {
                earnings: {
                    decrement: Math.max(0, dentistEarnings)
                }
            }
        })
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/bookings")

    return {
        success: true,
        refundAmount: refundAmount,
        stripeFee: stripeFee / 100, // Convert to EUR
        refunded: refundedSuccessfully
    }
}

