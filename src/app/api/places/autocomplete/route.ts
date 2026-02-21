import { NextRequest, NextResponse } from 'next/server'

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
            return NextResponse.json(
                { error: 'Google Places API key not configured' },
                { status: 500 }
            )
        }

        // Call Google Places Autocomplete API
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${apiKey}`
        )

        if (!response.ok) {
            console.error('Google Places API error:', response.status, response.statusText)
            return NextResponse.json({ predictions: [] })
        }

        const data = await response.json()

        // Check for API errors
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API error:', data.status, data.error_message || data.error)
            return NextResponse.json({ predictions: [] })
        }

        // Format the predictions
        const predictions = (data.predictions || []).map((prediction: any) => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
        }))

        return NextResponse.json({ predictions })
    } catch (error: any) {
        console.error('Error fetching places:', error?.message || error)
        return NextResponse.json({ predictions: [] })
    }
}
