"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { MapPin, Loader2 } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Input } from "@/components/ui/input"

interface LocationAutocompleteProps {
    value: string
    onChange: (value: string) => void
    onSelect: (place: { place_id: string; description: string }) => void
    placeholder?: string
}

export function LocationAutocomplete({ value, onChange, onSelect, placeholder }: LocationAutocompleteProps) {
    const [predictions, setPredictions] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [showSuggestions, setShowSuggestions] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)

    const debouncedValue = useDebounce(value, 300)

    React.useEffect(() => {
        const fetchPredictions = async () => {
            if (debouncedValue.length < 2) {
                setPredictions([])
                setShowSuggestions(false)
                return
            }

            setIsLoading(true)
            try {
                const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(debouncedValue)}`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setPredictions(data.predictions || [])
                setShowSuggestions(true)
                setSelectedIndex(-1)
            } catch (error: any) {
                console.error('Error fetching predictions:', error?.message || error)
                setPredictions([])
                setShowSuggestions(false)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPredictions()
    }, [debouncedValue])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < predictions.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : -1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && selectedIndex < predictions.length) {
                    onSelect(predictions[selectedIndex])
                    setShowSuggestions(false)
                }
                break
            case 'Escape':
                setShowSuggestions(false)
                setSelectedIndex(-1)
                break
        }
    }

    const handleSelect = (prediction: any) => {
        onSelect(prediction)
        setShowSuggestions(false)
        onChange(prediction.description)
    }

    return (
        <div className="relative">
            <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (predictions.length > 0) setShowSuggestions(true)
                    }}
                    onBlur={() => {
                        // Delay hiding to allow click events to complete
                        setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    placeholder={placeholder || "Enter location"}
                    className="pl-10 h-12 border-gray-200 bg-white focus:bg-white transition-colors w-full rounded-lg !text-gray-900 placeholder:text-gray-500"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                )}
            </div>

            {showSuggestions && predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul className="py-2">
                        {predictions.map((prediction, index) => (
                            <li
                                key={prediction.place_id}
                                onClick={() => handleSelect(prediction)}
                                className={`px-4 py-2 cursor-pointer transition-colors ${index === selectedIndex
                                    ? "bg-primary-50 text-primary-700"
                                    : "hover:bg-gray-50 text-gray-900"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium">{prediction.description}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
