"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

interface DentistLocation {
    id: string
    name: string
    location: string
    latitude: number
    longitude: number
    specialty: string
    rating: number
    reviews: number
    distance?: number | null
}

interface GoogleMapProps {
    dentists: DentistLocation[]
    onDentistClick?: (dentist: DentistLocation) => void
    center?: { lat: number, lng: number }
}

// Singleton to ensure Google Maps is loaded only once
let isGoogleMapsLoading = false
let isGoogleMapsLoaded = false
let loadPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
    if (isGoogleMapsLoaded) {
        return Promise.resolve()
    }

    if (loadPromise) {
        return loadPromise
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

    if (!apiKey) {
        return Promise.reject(new Error("Google Maps API key not configured"))
    }

    isGoogleMapsLoading = true

    loadPromise = new Promise((resolve, reject) => {
        // Define callback function globally BEFORE anything else
        ; (window as any).initGoogleMaps = () => {
            console.log('Google Maps callback fired successfully')
            isGoogleMapsLoaded = true
            isGoogleMapsLoading = false
            resolve()
        }

        // Check if Google Maps API is already available
        if ((window as any).google && (window as any).google.maps) {
            isGoogleMapsLoaded = true
            isGoogleMapsLoading = false
            resolve()
            return
        }

        // Check if script tag already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)
        if (existingScript) {
            // Wait for existing script to load or callback to be fired
            const checkInterval = setInterval(() => {
                if ((window as any).google && (window as any).google.maps) {
                    clearInterval(checkInterval)
                    isGoogleMapsLoaded = true
                    isGoogleMapsLoading = false
                    resolve()
                }
            }, 100)

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval)
                if (!isGoogleMapsLoaded) {
                    reject(new Error("Google Maps load timeout"))
                }
            }, 10000)
            return
        }

        // Load Google Maps API
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`
        script.async = true
        script.defer = true

        // Handle errors
        script.onerror = (error) => {
            console.error('Failed to load Google Maps script:', error)
            isGoogleMapsLoading = false
            loadPromise = null // Allow retry
            reject(new Error("Failed to load Google Maps script"))
        }

        document.head.appendChild(script)
    })

    return loadPromise
}

export function GoogleMap({ dentists, onDentistClick, center: searchCenter }: GoogleMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null)
    const mapInstanceRef = React.useRef<any>(null)
    const markersRef = React.useRef<any[]>([])
    const [isLoaded, setIsLoaded] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Load Google Maps API
    React.useEffect(() => {
        loadGoogleMaps()
            .then(() => {
                setIsLoaded(true)
            })
            .catch((err: any) => {
                console.error('Failed to load Google Maps:', err)
                const errorMessage = err?.message || err?.toString() || "Failed to load Google Maps"
                setError(errorMessage)
            })

        return () => {
            // Cleanup markers on unmount
            if (markersRef.current.length > 0) {
                markersRef.current.forEach(marker => marker.setMap(null))
                markersRef.current = []
            }
        }
    }, [])

    // Initialize map when API is loaded
    React.useEffect(() => {
        if (!isLoaded || !mapRef.current) return

        const google = (window as any).google

        // Filter dentists with valid coordinates
        const validDentists = dentists.filter(d => d.latitude && d.longitude)

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        // If the map instance exists but the container changed (e.g. after a hide/show toggle)
        // we need to re-create it or re-bind it. Simplest is to check if it's the same container.
        const shouldCreateMap = !mapInstanceRef.current ||
            (mapRef.current && mapInstanceRef.current.getDiv() !== mapRef.current)

        if (shouldCreateMap) {
            console.log('Creating new map instance')

            // Priority for center: 1. searchCenter prop, 2. first dentist, 3. default (Athens)
            const defaultCenter = { lat: 37.9838, lng: 23.7275 }
            const center = searchCenter
                ? searchCenter
                : validDentists.length > 0
                    ? { lat: validDentists[0].latitude, lng: validDentists[0].longitude }
                    : defaultCenter

            const map = new google.maps.Map(mapRef.current, {
                center: center,
                zoom: searchCenter ? 13 : (validDentists.length > 0 ? 12 : 11),
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: false,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            })

            mapInstanceRef.current = map

            // Force map to render
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize')
            }, 100)
        }

        const map = mapInstanceRef.current
        if (!map) return

        // Add search center marker if provided
        if (searchCenter) {
            new google.maps.Marker({
                position: searchCenter,
                map: map,
                title: 'Search Center',
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 6,
                    fillColor: "#ff4444",
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: "#ffffff",
                },
                zIndex: 1000
            })
        }

        // Add markers for each dentist
        const bounds = new google.maps.LatLngBounds()

        validDentists.forEach(dentist => {
            const marker = new google.maps.Marker({
                position: {
                    lat: dentist.latitude,
                    lng: dentist.longitude
                },
                map: map,
                title: dentist.name,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#0ea5e9',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 10
                }
            })

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 12px; min-width: 200px; font-family: sans-serif;">
                        <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #111827;">${dentist.name}</h3>
                        <p style="margin: 0 0 6px 0; font-size: 12px; color: #0ea5e9; font-weight: 500;">${dentist.specialty}</p>
                        <p style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280; line-height: 1.4;">${dentist.location}</p>
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #374151;">
                            <span style="color: #f59e0b;">★</span> ${dentist.rating} (${dentist.reviews} reviews)
                            ${dentist.distance !== null && dentist.distance !== undefined ? ` • <b>${dentist.distance.toFixed(1)} km</b>` : ''}
                        </div>
                    </div>
                `
            })

            marker.addListener('click', () => {
                infoWindow.open(map, marker)
                if (onDentistClick) {
                    onDentistClick(dentist)
                }
            })

            markersRef.current.push(marker)
            bounds.extend(new google.maps.LatLng(dentist.latitude, dentist.longitude))
        })

        // Fit map to show all markers
        if (validDentists.length > 0) {
            if (validDentists.length === 1 && !searchCenter) {
                map.setCenter({ lat: validDentists[0].latitude, lng: validDentists[0].longitude })
                map.setZoom(14)
            } else if (searchCenter && validDentists.length === 0) {
                map.setCenter(searchCenter)
                map.setZoom(13)
            } else {
                map.fitBounds(bounds)
                if (searchCenter) bounds.extend(searchCenter)

                // Don't zoom in too much
                const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
                    if (map.getZoom() && map.getZoom()! > 15) {
                        map.setZoom(15)
                    }
                })
            }
        } else if (searchCenter) {
            map.setCenter(searchCenter)
            map.setZoom(13)
        }

    }, [isLoaded, dentists, onDentistClick, searchCenter])

    if (error) {
        return (
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-red-600 font-medium mb-2">Map Error</p>
                    <p className="text-sm text-gray-600">{error}</p>
                    <p className="text-xs text-gray-500 mt-2">Please check your Google Maps API key in .env.local</p>
                </div>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading map...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={mapRef}
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '384px', minWidth: '100%' }}
        />
    )
}
