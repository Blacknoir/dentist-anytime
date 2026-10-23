"use server"

import { prisma } from "@/lib/prisma"
import { matchesLocation } from "@/lib/location-match"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Radius of earth in km
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
    lng?: number,
    location?: string,
    radius?: number // Radius in km
) {
    const where: any = {
        isVerified: true
    }

    if (query) {
        where.OR = [
            { specialty: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } }
        ]
    }

    if (specialty) {
        where.specialty = { contains: specialty, mode: 'insensitive' }
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

    // Filter by location if provided
    if (location && (!lat || !lng)) {
        results = results.filter(dentist => {
            // First try matching by city field (structured)
            if (dentist.city) {
                const cityMatch = matchesLocation(dentist.city, location)
                if (cityMatch) return true
            }
            // Fall back to matching by location field (legacy)
            return matchesLocation(dentist.location || "", location)
        })
    }

    // Add distance and filter by radius if lat/lng provided
    if (lat && lng) {
        results = results.map(d => {
            if (d.latitude && d.longitude) {
                const distance = calculateDistance(lat, lng, d.latitude, d.longitude)
                return { ...d, distance }
            }
            return { ...d, distance: null }
        })

        // Filter by radius if specified, but also include city matches
        if (radius) {
            results = results.filter(d => {
                // Include if within radius
                if (d.distance !== null && d.distance <= radius) return true
                // Also include if city matches the search location (for dentists without coordinates)
                if (location && d.city) {
                    return matchesLocation(d.city, location)
                }
                if (location && d.location) {
                    return matchesLocation(d.location, location)
                }
                return false
            })
        }

        // Sort by distance (dentists with distance first, then those without)
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
        }
    })

    return dentist
}
