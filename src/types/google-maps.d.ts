declare namespace google.maps {
    interface Map {
        fitBounds(bounds: LatLngBounds): void
        getZoom(): number | undefined
        setZoom(zoom: number): void
    }

    interface MapOptions {
        center: LatLng | LatLngLiteral
        zoom: number
        mapTypeId?: MapTypeId
        styles?: MapTypeStyle[]
    }

    enum MapTypeId {
        ROADMAP = "roadmap",
        SATELLITE = "satellite",
        HYBRID = "hybrid",
        TERRAIN = "terrain"
    }

    interface MapTypeStyle {
        featureType?: string
        elementType?: string
        stylers: Array<{ [key: string]: any }>
    }

    interface LatLng {
        lat(): number
        lng(): number
    }

    interface LatLngLiteral {
        lat: number
        lng: number
    }

    interface LatLngBounds {
        extend(point: LatLng | LatLngLiteral): void
    }

    interface Marker {
        setMap(map: Map | null): void
        addListener(eventName: string, handler: Function): MapsEventListener
    }

    interface MarkerOptions {
        position: LatLng | LatLngLiteral
        map: Map | null
        title?: string
        animation?: Animation
    }

    enum Animation {
        DROP = "DROP",
        BOUNCE = "BOUNCE"
    }

    interface InfoWindow {
        open(map: Map, anchor?: Marker): void
    }

    interface InfoWindowOptions {
        content: string
    }

    interface MapsEventListener {
        remove(): void
    }

    interface event {
        addListenerOnce(instance: any, eventName: string, handler: Function): MapsEventListener
        removeListener(listener: MapsEventListener): void
    }
}

declare namespace google {
    namespace maps {
        const MapTypeId: typeof google.maps.MapTypeId
        const Animation: typeof google.maps.Animation
        const event: typeof google.maps.event
    }
}
