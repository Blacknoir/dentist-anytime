"use server"

import { prisma } from "@/lib/prisma"

export async function getDentists(query?: string, specialty?: string, maxPrice?: number, minRating?: number) {
    const where: any = {
        isVerified: true
    }

    if (query) {
        where.OR = [
            { specialty: { contains: query } },
            { location: { contains: query } },
            { user: { name: { contains: query } } }
        ]
    }

    if (specialty) {
        where.specialty = { contains: specialty }
    }

    if (maxPrice) {
        where.priceFrom = { lte: maxPrice }
    }

    if (minRating) {
        where.rating = { gte: minRating }
    }

    const dentists = await prisma.dentistProfile.findMany({
        where,
        include: {
            user: true,
            services: true,
            availability: true
        }
    })

    return dentists
}

export async function getDentistById(id: string) {
    if (!id) return null

    const dentist = await prisma.dentistProfile.findUnique({
        where: { id },
        include: {
            user: true,
            services: true,
            availability: true
        }
    })

    return dentist
}
