"use server"

import { prisma } from "@/lib/prisma"

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

// City name mappings for intelligent matching
// Maps various city name variations to a standardized name
const CITY_MAPPINGS: Record<string, string[]> = {
    "Athens": ["Αθήνα", "Athina", "Αθηνα"],
    "Thessaloniki": ["Θεσσαλονίκη", "Thessaloniki", "Θεσσαλονικη", "Thessaloniki", "Thessalonikis"],
    "Patra": ["Πάτρα", "Patras", "Patra", "Πατρα"],
    "Heraklion": ["Ηράκλειο", "Iraklion", "Irakleio", "Ηρακλειο", "Heraklion"],
    "Volos": ["Βόλος", "Volos", "Βολος"],
    "Larissa": ["Λάρισσα", "Larisa", "Λαρισσα", "Larissa"],
    "Komotini": ["Κομοτηνή", "Komotini", "Κομοτηνη"],
    "Ioannina": ["Ιωάννινα", "Ioannina", "Ιωαννινα"],
    "New York": ["Νέα Υόρκη", "New York", "Νεα Υορκη", "NYC"],
    "Queens": ["Κουίνς", "Queens", "Κουινς"],
    "Brooklyn": ["Μπρούκλιν", "Brooklyn", "Μπρουκλιν"],
    "Manhattan": ["Μανχάταν", "Manhattan", "Μανχαταν"],
    "Bronx": ["Μπρονξ", "Bronx"],
    "Staten Island": ["Στάτεν Άιλαντ", "Staten Island", "Στατεν Αιλαντ"]
}

// Reverse mapping: maps each variation to the standardized name
const REVERSE_CITY_MAPPINGS: Record<string, string> = {}

// Build reverse mappings
for (const [standardName, variations] of Object.entries(CITY_MAPPINGS)) {
    for (const variation of variations) {
        // Add both lowercase and original for case-insensitive matching
        REVERSE_CITY_MAPPINGS[variation.toLowerCase()] = standardName
        REVERSE_CITY_MAPPINGS[variation] = standardName
    }
    // Also map the standard name to itself
    REVERSE_CITY_MAPPINGS[standardName.toLowerCase()] = standardName
    REVERSE_CITY_MAPPINGS[standardName] = standardName
}

/**
 * Extracts the city name from a location string
 * Handles various formats like "Thessaloniki, Greece" or "Θεσσαλονίκη"
 */
function extractCityName(location: string): string | null {
    if (!location) return null

    // Remove common suffixes
    const cleaned = location
        .replace(/,\s*Greece$/i, "")
        .replace(/,\s*Ελλάδα$/i, "")
        .replace(/,\s*USA$/i, "")
        .replace(/,\s*United States$/i, "")
        .replace(/,\s*NY$/i, "")
        .replace(/,\s*NYC$/i, "")
        .trim()

    // Check if the cleaned location matches any variation
    const normalized = cleaned.toLowerCase()
    const standardName = REVERSE_CITY_MAPPINGS[normalized] || REVERSE_CITY_MAPPINGS[cleaned]

    if (standardName) {
        return standardName
    }

    // If no exact match, try to find a partial match
    for (const [standardName, variations] of Object.entries(CITY_MAPPINGS)) {
        for (const variation of variations) {
            if (normalized.includes(variation.toLowerCase()) ||
                variation.toLowerCase().includes(normalized)) {
                return standardName
            }
        }
    }

    // Return the cleaned location if no mapping found
    return cleaned
}

/**
 * Checks if a dentist's location matches the search location
 * Handles both English and Greek city names
 */
function matchesLocation(dentistLocation: string, searchLocation: string): boolean {
    if (!dentistLocation || !searchLocation) return false

    const searchCity = extractCityName(searchLocation)
    const dentistCity = extractCityName(dentistLocation)

    if (!searchCity || !dentistCity) return false

    // If both are standardized names, compare them directly
    const searchStandard = REVERSE_CITY_MAPPINGS[searchCity.toLowerCase()] || searchCity
    const dentistStandard = REVERSE_CITY_MAPPINGS[dentistCity.toLowerCase()] || dentistCity

    return searchStandard === dentistStandard
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
            { specialty: { contains: query } },
            { location: { contains: query } }
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

    // Filter by location if provided
    if (location && (!lat || !lng)) {
        results = results.filter(dentist => {
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

        // Filter by radius if specified
        if (radius) {
            results = results.filter(d => d.distance !== null && d.distance <= radius)
        } else if (location) {
            // If location was selected from autocomplete, we might want a default radius (e.g., 50km)
            // or just show closest ones. Let's stick to showing closest first if no radius.
        }

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
