"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const dates = [12, 13, 14, 15, 16, 17, 18]
const slots = [
    { time: "09:00 AM", available: true },
    { time: "09:30 AM", available: false },
    { time: "10:00 AM", available: true },
    { time: "10:30 AM", available: true },
    { time: "11:00 AM", available: false },
    { time: "11:30 AM", available: true },
    { time: "02:00 PM", available: true },
    { time: "02:30 PM", available: true },
    { time: "03:00 PM", available: false },
    { time: "03:30 PM", available: true },
    { time: "04:00 PM", available: true },
    { time: "04:30 PM", available: true },
]

export function AvailabilityCalendar() {
    const [selectedDate, setSelectedDate] = React.useState(14)
    const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null)

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Date Selector */}
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-4">
                {days.map((day, index) => (
                    <button
                        key={day}
                        onClick={() => setSelectedDate(dates[index])}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[40px]",
                            selectedDate === dates[index]
                                ? "bg-primary-500 text-white shadow-md"
                                : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        <span className="text-xs font-medium opacity-80">{day}</span>
                        <span className="text-sm font-bold">{dates[index]}</span>
                    </button>
                ))}
            </div>

            {/* Time Slots */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Available slots for Wed, Oct {selectedDate}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot, index) => (
                        <button
                            key={index}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={cn(
                                "py-2 px-1 text-sm font-medium rounded-md border transition-all",
                                !slot.available
                                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed decoration-slice"
                                    : selectedSlot === slot.time
                                        ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-primary-500 hover:text-primary-600"
                            )}
                        >
                            {slot.time}
                        </button>
                    ))}
                </div>
            </div>

            <Button className="w-full" size="lg" disabled={!selectedSlot}>
                {selectedSlot ? `Book for ${selectedSlot}` : "Select a time"}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-4">
                No credit card required for booking
            </p>
        </div>
    )
}
