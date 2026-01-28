"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
            availability: true
        }
    })
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

    return await prisma.availability.createMany({
        data: data.map(a => ({
            dentistProfileId: dentist.id,
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime
        }))
    })
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
