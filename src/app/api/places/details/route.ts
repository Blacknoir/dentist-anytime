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
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components,formatted_address&key=${apiKey}`
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
        const addressComponents = data.result.address_components || []

        // Extract structured address from Google's address components
        let city = ''
        let streetAddress = ''
        let houseNumber = ''

        for (const component of addressComponents) {
            const types: string[] = component.types || []
            if (types.includes('locality')) {
                city = component.long_name
            } else if (types.includes('administrative_area_level_3') && !city) {
                // Fallback for cities in some countries
                city = component.long_name
            } else if (types.includes('route')) {
                streetAddress = component.long_name
            } else if (types.includes('street_number')) {
                houseNumber = component.long_name
            }
        }

        return NextResponse.json({
            lat: location.lat,
            lng: location.lng,
            city,
            streetAddress,
            houseNumber,
            formattedAddress: data.result.formatted_address || ''
        })
    } catch (error: any) {
        console.error('Error fetching place details:', error?.message || error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
