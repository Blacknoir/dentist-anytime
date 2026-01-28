"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/LanguageContext"
import { Clock, Plus, Trash2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateDentistAvailability } from "@/app/actions/dashboard"
import { useRouter } from "next/navigation"

const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

export function AvailabilityForm({ initialData }: { initialData: any[] }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [availability, setAvailability] = useState(
        DAYS.map((day, index) => {
            const existing = initialData.find(a => a.dayOfWeek === (index + 1) % 7)
            return {
                day,
                dayOfWeek: (index + 1) % 7,
                enabled: !!existing,
                startTime: existing?.startTime || "09:00",
                endTime: existing?.endTime || "17:00"
            }
        })
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const enabledDays = availability
                .filter(a => a.enabled)
                .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))

            await updateDentistAvailability(enabledDays)
            router.refresh()
            alert("Availability updated!")
        } catch (error) {
            console.error(error)
            alert("Failed to update availability.")
        } finally {
            setLoading(false)
        }
    }

    const toggleDay = (index: number) => {
        const newAvailability = [...availability]
        newAvailability[index].enabled = !newAvailability[index].enabled
        setAvailability(newAvailability)
    }

    const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newAvailability = [...availability]
        newAvailability[index][field] = value
        setAvailability(newAvailability)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Working Hours</h1>
                    <p className="text-gray-500">Set your weekly schedule and availability.</p>
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Schedule</>}
                </Button>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {availability.map((item, index) => (
                        <div key={item.day} className="flex items-center gap-6 py-4 border-b border-gray-50 last:border-0">
                            <div className="w-32">
                                <Label className="text-sm font-bold text-gray-900">{item.day}</Label>
                            </div>

                            <div className="flex items-center gap-4 flex-1">
                                <button
                                    type="button"
                                    onClick={() => toggleDay(index)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                                        item.enabled
                                            ? "bg-primary-100 text-primary-700 border border-primary-200"
                                            : "bg-gray-100 text-gray-500 border border-gray-200"
                                    )}
                                >
                                    {item.enabled ? "Available" : "Unavailable"}
                                </button>

                                {item.enabled && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="time"
                                                className="pl-10 w-32"
                                                value={item.startTime}
                                                onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <span className="text-gray-400">to</span>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="time"
                                                className="pl-10 w-32"
                                                value={item.endTime}
                                                onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </form>
    )
}
