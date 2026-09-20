import { NextRequest, NextResponse } from 'next/server'
import { searchLocalPlaces } from '@/lib/greek-places'

function toLocalPredictions(input: string) {
    return searchLocalPlaces(input).map((place) => ({
        place_id: `local:${place.id}`,
        description: `${place.name}, Ελλάδα`,
        structured_formatting: {
            main_text: place.name,
            secondary_text: 'Ελλάδα',
        },
    }))
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const input = searchParams.get('input') as string

    if (!input || input.length < 2) {
        return NextResponse.json({ predictions: [] })
    }

    try {
        // Get Google Places API key from environment variables
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

        if (!apiKey) {
            // Χωρίς κλειδί: τοπικό fallback ώστε να υπάρχουν ΠΑΝΤΑ προτάσεις
            return NextResponse.json({ predictions: toLocalPredictions(input) })
        }

        // Call Google Places Autocomplete API (ελληνικά, περιοχές GR — όχι μόνο πόλεις)
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(regions)&language=el&components=country:GR&key=${apiKey}`
        )

        if (!response.ok) {
            console.error('Google Places API error:', response.status, response.statusText)
            return NextResponse.json({ predictions: toLocalPredictions(input) })
        }

        const data = await response.json()

        // Check for API errors (π.χ. REQUEST_DENIED όταν το project δεν έχει Places API)
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', data.status, data.error_message || data.error)
            return NextResponse.json({ predictions: toLocalPredictions(input) })
        }

        // Format the predictions
        const predictions = (data.predictions || []).map((prediction: any) => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
        }))

        // Αν το Google δεν βρήκε τίποτα, συμπλήρωσε με τοπικά (π.χ. προάστια)
        if (predictions.length === 0) {
            return NextResponse.json({ predictions: toLocalPredictions(input) })
        }

        return NextResponse.json({ predictions })
    } catch (error: any) {
        console.error('Error fetching places:', error?.message || error)
        return NextResponse.json({ predictions: toLocalPredictions(input) })
    }
}
