"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getDashboardStats() {
    const session = await auth()
    if (!session?.user?.id) return null

    const role = (session.user as any).role

    if (role === "DENTIST") {
        const dentist = await prisma.dentistProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                _count: {
                    select: {
                        bookings: true,
                    }
                },
                bookings: {
                    where: {
                        date: {
                            gte: new Date()
                        }
                    },
                    include: {
                        patient: true
                    },
                    orderBy: {
                        date: 'asc'
                    },
                    take: 5
                }
            }
        })

        if (!dentist) return null

        return {
            role: "DENTIST",
            id: dentist.id,
            totalBookings: dentist._count.bookings,
            upcomingBookings: dentist.bookings,
            rating: dentist.rating,
            reviewCount: dentist.reviewCount,
            experienceYears: dentist.experienceYears,
            isVerified: (dentist as any).isVerified,
            isPendingVerification: (dentist as any).isPendingVerification,
            totalPatients: 1250, // Mock
            revenue: 12500, // Mock

            // Availability Status
            todayAvailability: await getTodayAvailability(dentist.id),

            // Stripe Status
            stripeAccountId: (dentist as any).stripeAccountId,
            isStripeConnected: !!(dentist as any).stripeAccountId,
        }
    } else {
        // Patient Stats
        const bookings = await prisma.booking.findMany({
            where: { patientId: session.user.id },
            include: {
                dentistProfile: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        return {
            role: "PATIENT",
            totalBookings: bookings.length,
            upcomingBookings: bookings.filter(b => new Date(b.date) >= new Date()),
            completedBookings: bookings.filter(b => new Date(b.date) < new Date()),
        }
    }
}

export async function getDentistProfile() {
    const session = await auth()
    if (!session?.user?.id) return null

    return await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            user: true,
            services: true,
            availability: true,
            exceptions: {
                where: {
                    date: {
                        gte: new Date()
                    }
                }
            }
        } as any
    })
}

export async function updateDayAvailability(dateString: string, data: { isClosed: boolean, slots: { startTime: string, endTime: string }[] }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await (prisma as any).dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist not found")

    // The dateString is in YYYY-MM-DD format, we want to store it as a UTC midnight Date
    const normalizedDate = new Date(dateString + 'T00:00:00Z')

    // Delete existing records for this day
    await (prisma as any).availabilityException.deleteMany({
        where: {
            dentistProfileId: dentist.id,
            date: normalizedDate
        }
    })

    if (data.isClosed) {
        // Create one "Closed" exception
        await (prisma as any).availabilityException.create({
            data: {
                dentistProfileId: dentist.id,
                date: normalizedDate,
                isClosed: true
            }
        })
    } else if (data.slots && data.slots.length > 0) {
        // Create an exception for each slot
        await (prisma as any).availabilityException.createMany({
            data: data.slots.map(slot => ({
                dentistProfileId: dentist.id,
                date: normalizedDate,
                isClosed: false,
                startTime: slot.startTime,
                endTime: slot.endTime
            }))
        })
    }

    revalidatePath(`/dentist/${dentist.id}`)
    revalidatePath('/dashboard/availability')
}

export async function resetDayAvailability(dateString: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist not found")

    const normalizedDate = new Date(dateString + 'T00:00:00Z')

    await (prisma as any).availabilityException.deleteMany({
        where: {
            dentistProfileId: dentist.id,
            date: normalizedDate
        }
    })

    revalidatePath(`/dentist/${dentist.id}`)
    revalidatePath('/dashboard/availability')
}

export async function getDentistBookings() {
    const session = await auth()
    if (!session?.user?.id) return []

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) return []

    return await prisma.booking.findMany({
        where: { dentistProfileId: dentist.id },
        include: {
            patient: true
        },
        orderBy: {
            date: 'desc'
        }
    })
}

export async function updateDentistProfile(data: any) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return await prisma.dentistProfile.update({
        where: { userId: session.user.id },
        data: {
            specialty: data.specialty,
            location: data.location,
            about: data.about,
            education: data.education,
            experienceYears: data.experienceYears,
            priceFrom: data.priceFrom,
            image: data.image
        }
    })
}

export async function updateDentistAvailability(data: any[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist not found")

    // Simple implementation: delete and recreate availability
    await prisma.availability.deleteMany({
        where: { dentistProfileId: dentist.id }
    })

    await prisma.availability.createMany({
        data: data.map(a => ({
            dentistProfileId: dentist.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime
        }))
    })

    revalidatePath(`/dentist/${dentist.id}`)
    revalidatePath('/dashboard/availability')
    revalidatePath('/dashboard')
}

export async function updateDentistServices(data: any[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist not found")

    // Delete and recreate services
    await prisma.service.deleteMany({
        where: { dentistProfileId: dentist.id }
    })

    return await prisma.service.createMany({
        data: data.map(s => ({
            dentistProfileId: dentist.id,
            name: s.name,
            price: s.price,
            duration: s.duration
        }))
    })
}

async function getTodayAvailability(dentistId: string) {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]
    const dayOfWeek = today.getDay()

    // 1. Check exceptions
    const exceptions = await (prisma as any).availabilityException.findMany({
        where: {
            dentistProfileId: dentistId,
            date: {
                gte: new Date(todayString + 'T00:00:00Z'),
                lt: new Date(todayString + 'T23:59:59Z'),
            }
        }
    })

    if (exceptions.length > 0) {
        if (exceptions.some((e: any) => e.isClosed)) return { isClosed: true }
        // Sort and return slots
        const sorted = exceptions.sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""))
        return {
            isClosed: false,
            startTime: sorted[0].startTime,
            endTime: sorted[sorted.length - 1].endTime,
            isMultiple: exceptions.length > 1
        }
    }

    // 2. Check weekly availability
    const weekly = await prisma.availability.findMany({
        where: {
            dentistProfileId: dentistId,
            dayOfWeek: dayOfWeek
        }
    })

    if (weekly.length === 0) return { isClosed: true }

    const sortedWeekly = weekly.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return {
        isClosed: false,
        startTime: sortedWeekly[0].startTime,
        endTime: sortedWeekly[sortedWeekly.length - 1].endTime,
        isMultiple: weekly.length > 1
    }
}
