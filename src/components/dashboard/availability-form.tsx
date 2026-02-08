"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/LanguageContext"
import { Clock, Plus, Trash2, Save, Calendar, Settings2, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateDentistAvailability } from "@/app/actions/dashboard"
import { useRouter } from "next/navigation"
import { CalendarAvailability } from "./calendar-availability"

const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export function AvailabilityForm({ initialData, exceptions = [] }: { initialData: any[], exceptions?: any[] }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'weekly' | 'calendar'>('calendar')

    // Transform initialData into a grouped format: dayOfWeek -> slots[]
    const [availability, setAvailability] = useState(
        DAYS.map((day, index) => {
            const dayOfWeek = (index + 1) % 7
            const daySlots = initialData.filter(a => a.dayOfWeek === dayOfWeek)

            return {
                day,
                dayOfWeek,
                enabled: daySlots.length > 0,
                slots: daySlots.length > 0
                    ? daySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime, id: s.id }))
                    : [{ startTime: "09:00", endTime: "17:00" }]
            }
        })
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const allSlots = availability
                .filter(a => a.enabled)
                .flatMap(day =>
                    day.slots.map(slot => ({
                        dayOfWeek: day.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime
                    }))
                )

            await updateDentistAvailability(allSlots)
            router.refresh()
            alert("Weekly schedule updated successfully!")
        } catch (error) {
            console.error(error)
            alert("Failed to update schedule.")
        } finally {
            setLoading(false)
        }
    }

    const toggleDay = (index: number) => {
        const newAvailability = [...availability]
        newAvailability[index].enabled = !newAvailability[index].enabled
        setAvailability(newAvailability)
    }

    const addSlot = (dayIndex: number) => {
        const newAvailability = [...availability]
        newAvailability[dayIndex].slots.push({ startTime: "09:00", endTime: "17:00" } as any)
        setAvailability(newAvailability)
    }

    const removeSlot = (dayIndex: number, slotIndex: number) => {
        const newAvailability = [...availability]
        if (newAvailability[dayIndex].slots.length > 1) {
            newAvailability[dayIndex].slots.splice(slotIndex, 1)
        } else {
            newAvailability[dayIndex].enabled = false
        }
        setAvailability(newAvailability)
    }

    const updateTime = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
        const newAvailability = [...availability]
        newAvailability[dayIndex].slots[slotIndex][field] = value
        setAvailability(newAvailability)
    }

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
                    <p className="text-gray-500 text-sm">Organize your weekly schedule and handle specific date overrides.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'calendar' ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Calendar className="h-4 w-4" />
                        Calendar View
                    </button>
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'weekly' ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <Settings2 className="h-4 w-4" />
                        Weekly Schedule
                    </button>
                </div>
            </div>

            {activeTab === 'calendar' ? (
                <div className="space-y-6">
                    <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-primary-900">Custom Day Organizer</p>
                            <p className="text-xs text-primary-700 mt-0.5 leading-relaxed">
                                Click on any day to precisely adjust your working hours for that specific date.
                                You can add multiple time blocks (e.g., morning and afternoon) or mark yourself as closed.
                            </p>
                        </div>
                    </div>
                    <CalendarAvailability exceptions={exceptions} weeklyAvailability={initialData} />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
                            <div>
                                <CardTitle className="text-lg font-bold">Standard Weekly Schedule</CardTitle>
                                <p className="text-xs text-gray-500 mt-1">These blocks will repeat every week unless overridden in the calendar.</p>
                            </div>
                            <Button type="submit" disabled={loading} className="gap-2 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-100 h-11 px-6">
                                {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Weekly Schedule</>}
                            </Button>
                        </CardHeader>
                        <CardContent className="divide-y divide-gray-50">
                            {availability.map((dayItem, dayIndex) => (
                                <div key={dayItem.day} className="flex flex-col md:flex-row md:items-start gap-4 py-8 px-2 hover:bg-gray-50/10 transition-colors">
                                    <div className="w-40 flex flex-col gap-2">
                                        <Label className="text-sm font-black text-gray-900 uppercase tracking-tight">{dayItem.day}</Label>
                                        <button
                                            type="button"
                                            onClick={() => toggleDay(dayIndex)}
                                            className={cn(
                                                "w-24 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                                dayItem.enabled
                                                    ? "bg-green-500 text-white border-green-600 shadow-sm"
                                                    : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                                            )}
                                        >
                                            {dayItem.enabled ? "Enabled" : "Disabled"}
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        {dayItem.enabled ? (
                                            <div className="space-y-4">
                                                {dayItem.slots.map((slot, slotIndex) => (
                                                    <div key={slotIndex} className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                                        <div className="flex items-center gap-4 bg-white p-3 border border-gray-100 rounded-2xl shadow-sm">
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                                                                <Input
                                                                    type="time"
                                                                    className="h-10 pl-10 w-36 border-none focus:ring-0 font-bold bg-gray-50 rounded-lg"
                                                                    value={slot.startTime}
                                                                    onChange={(e) => updateTime(dayIndex, slotIndex, 'startTime', e.target.value)}
                                                                />
                                                            </div>
                                                            <span className="text-gray-300 font-bold">—</span>
                                                            <div className="relative">
                                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                                                                <Input
                                                                    type="time"
                                                                    className="h-10 pl-10 w-36 border-none focus:ring-0 font-bold bg-gray-50 rounded-lg"
                                                                    value={slot.endTime}
                                                                    onChange={(e) => updateTime(dayIndex, slotIndex, 'endTime', e.target.value)}
                                                                />
                                                            </div>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                                onClick={() => removeSlot(dayIndex, slotIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 rounded-xl border-dashed border-2 hover:border-primary-500 hover:text-primary-600 gap-2 border-gray-200"
                                                    onClick={() => addSlot(dayIndex)}
                                                >
                                                    <PlusCircle className="h-4 w-4" />
                                                    Add Another Block
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="py-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center">
                                                <p className="text-xs text-gray-400 font-medium italic">No hours defined. Clinic is closed on this day.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </form>
            )}
        </div>
    )
}
