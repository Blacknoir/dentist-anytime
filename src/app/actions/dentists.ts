"use server"

import { prisma } from "@/lib/prisma"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in km
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export async function getDentists(
    query?: string,
    specialty?: string,
    maxPrice?: number,
    minRating?: number,
    lat?: number,
    lng?: number
) {
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

    const dentistsFromDb = await prisma.dentistProfile.findMany({
        where,
        include: {
            user: true,
            services: true,
            availability: true,
            exceptions: true
        } as any
    })

    let results: any[] = dentistsFromDb

    // Add distance if lat/lng provided
    if (lat && lng) {
        results = results.map(d => {
            if (d.latitude && d.longitude) {
                const distance = calculateDistance(lat, lng, d.latitude, d.longitude)
                return { ...d, distance }
            }
            return { ...d, distance: null }
        })

        // Sort by distance
        results.sort((a, b) => {
            const distA = a.distance as number | null
            const distB = b.distance as number | null
            if (distA === null) return 1
            if (distB === null) return -1
            return distA - distB
        })
    }

    return results
}

export async function getDentistById(id: string) {
    if (!id) return null

    const dentist = await prisma.dentistProfile.findUnique({
        where: { id },
        include: {
            user: true,
            services: true,
            availability: true,
            exceptions: true
        } as any
    })

    return dentist
}
