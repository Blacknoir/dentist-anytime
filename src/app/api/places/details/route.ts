import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('placeId')

    if (!placeId) {
        return NextResponse.json(
            { error: 'Place ID is required' },
            { status: 400 }
        )
    }

    try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google Places API key not configured' },
                { status: 500 }
            )
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${apiKey}`
        )

        if (!response.ok) {
            console.error('Google Places Details API error:', response.status, response.statusText)
            return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 })
        }

        const data = await response.json()

        if (data.status !== 'OK') {
            console.error('Google Places Details API error status:', data.status, data.error_message)
            return NextResponse.json({ error: data.status }, { status: 400 })
        }

        const location = data.result.geometry.location
        return NextResponse.json({
            lat: location.lat,
            lng: location.lng
        })
    } catch (error: any) {
        console.error('Error fetching place details:', error?.message || error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
