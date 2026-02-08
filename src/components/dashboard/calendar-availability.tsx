"use client"

import * as React from "react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    isToday
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, X, Clock, Save, Trash2, AlertCircle, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { updateDayAvailability, resetDayAvailability } from "@/app/actions/dashboard"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface CalendarAvailabilityProps {
    exceptions: any[]
    weeklyAvailability: any[]
}

export function CalendarAvailability({ exceptions, weeklyAvailability }: CalendarAvailabilityProps) {
    const router = useRouter()
    const [currentDate, setCurrentDate] = React.useState(new Date())
    const [loading, setLoading] = React.useState(false)
    const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)

    const [modalOpen, setModalOpen] = React.useState(false)
    const [isClosed, setIsClosed] = React.useState(false)
    const [slots, setSlots] = React.useState<{ startTime: string, endTime: string }[]>([{ startTime: "09:00", endTime: "17:00" }])

    const onDateClick = (day: Date) => {
        const dayString = format(day, "yyyy-MM-dd")
        const dateExceptions = exceptions.filter((e) => {
            const eDate = new Date(e.date)
            const eString = eDate.toISOString().split('T')[0]
            return eString === dayString
        })

        setSelectedDay(day)

        if (dateExceptions.length > 0) {
            const first = dateExceptions[0]
            setIsClosed(first.isClosed)
            if (first.isClosed) {
                setSlots([{ startTime: "09:00", endTime: "17:00" }])
            } else {
                setSlots(dateExceptions.map(e => ({ startTime: e.startTime || "09:00", endTime: e.endTime || "17:00" })))
            }
        } else {
            const dayOfWeek = day.getDay()
            const weeklyAvails = weeklyAvailability.filter(a => a.dayOfWeek === dayOfWeek)
            setIsClosed(weeklyAvails.length === 0)
            if (weeklyAvails.length > 0) {
                setSlots(weeklyAvails.map(a => ({ startTime: a.startTime, endTime: a.endTime })))
            } else {
                setSlots([{ startTime: "09:00", endTime: "17:00" }])
            }
        }

        setModalOpen(true)
    }

    const addSlot = () => {
        setSlots([...slots, { startTime: "09:00", endTime: "17:00" }])
    }

    const removeSlot = (index: number) => {
        const newSlots = [...slots]
        if (newSlots.length > 1) {
            newSlots.splice(index, 1)
            setSlots(newSlots)
        } else {
            setIsClosed(true)
        }
    }

    const updateSlotTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newSlots = [...slots]
        newSlots[index][field] = value
        setSlots(newSlots)
    }

    const handleSave = async () => {
        if (!selectedDay) return
        const dateString = format(selectedDay, "yyyy-MM-dd")
        setLoading(true)
        try {
            // We pass the full array of slots to the server action
            await updateDayAvailability(dateString, {
                isClosed,
                slots: isClosed ? [] : slots
            })
            setModalOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        if (!selectedDay) return
        const dateString = format(selectedDay, "yyyy-MM-dd")
        setLoading(true)
        try {
            await resetDayAvailability(dateString)
            setModalOpen(false)
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 leading-none">
                        {format(currentDate, "MMMM yyyy")}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        return (
            <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
                {days.map((day) => (
                    <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

        return (
            <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const dayString = format(day, "yyyy-MM-dd")
                    const dateExceptions = exceptions.filter((e) => {
                        const eDate = new Date(e.date)
                        return eDate.toISOString().split('T')[0] === dayString
                    })

                    const dayOfWeek = day.getDay()
                    const weeklyAvails = weeklyAvailability.filter(a => a.dayOfWeek === dayOfWeek)

                    let displaySlots: { startTime: string, endTime: string }[] = []
                    let isAvailable = false
                    let isOverride = dateExceptions.length > 0

                    if (isOverride) {
                        const closed = dateExceptions.some(e => e.isClosed)
                        if (!closed) {
                            isAvailable = true
                            displaySlots = dateExceptions.map(e => ({ startTime: e.startTime, endTime: e.endTime }))
                        }
                    } else {
                        isAvailable = weeklyAvails.length > 0
                        displaySlots = weeklyAvails.map(a => ({ startTime: a.startTime, endTime: a.endTime }))
                    }

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => isCurrentMonth && onDateClick(day)}
                            className={cn(
                                "min-h-[120px] border-r border-b border-gray-50 p-3 transition-all cursor-pointer relative group overflow-hidden",
                                !isCurrentMonth ? "bg-gray-50/30 cursor-default" : "hover:bg-primary-50/40",
                                isAvailable ? "bg-white" : "bg-red-50/20"
                            )}
                        >
                            <div className="flex justify-between items-start z-10 relative">
                                <span className={cn(
                                    "text-sm font-bold",
                                    !isCurrentMonth ? "text-gray-300" : isToday(day) ? "text-primary-600 bg-primary-50 w-7 h-7 rounded-full flex items-center justify-center -ml-1 -mt-1 shadow-sm border border-primary-100" : "text-gray-700"
                                )}>
                                    {format(day, "d")}
                                </span>
                                {isCurrentMonth && (
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isAvailable ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                    )} />
                                )}
                            </div>

                            {isCurrentMonth && (
                                <div className="mt-3 space-y-1 z-10 relative">
                                    {isAvailable ? (
                                        displaySlots.slice(0, 2).map((s, i) => (
                                            <div key={i} className="text-[9px] font-black text-green-700 bg-green-50/80 border border-green-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Clock className="h-2.5 w-2.5" />
                                                {s.startTime}-{s.endTime}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-[10px] font-bold text-red-700 bg-red-50/80 border border-red-100 px-2 py-1 rounded-md text-center">
                                            Closed
                                        </div>
                                    )}
                                    {displaySlots.length > 2 && (
                                        <div className="text-[8px] text-gray-400 font-bold ml-1">+{displaySlots.length - 2} more</div>
                                    )}
                                    {isOverride && (
                                        <div className="inline-flex items-center gap-1 text-[8px] text-primary-600 font-black uppercase tracking-tighter bg-white shadow-sm px-1 rounded">
                                            <AlertCircle className="h-2 w-2" />
                                            Override
                                        </div>
                                    )}
                                </div>
                            )}

                            {isCurrentMonth && (
                                <div className="absolute inset-x-0 bottom-0 py-1.5 opacity-0 group-hover:opacity-100 bg-primary-600 flex items-center justify-center transition-all translate-y-full group-hover:translate-y-0 z-20">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        Edit All Hours
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-tight">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-tight">Closed</span>
                </div>
                <div className="flex items-center gap-2 ml-auto text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                    <Info className="h-3.5 w-3.5 text-primary-500" />
                    <span>Click any day to manage multiple time blocks and gaps.</span>
                </div>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setModalOpen(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
                        >
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-none">Edit Day Organizer</h3>
                                        <p className="text-xs text-gray-500 mt-1">{selectedDay && format(selectedDay, "EEEE, MMMM d, yyyy")}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setModalOpen(false)} className="rounded-full">
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold text-gray-900">Clinic Status</Label>
                                        <p className="text-xs text-gray-500">Is the clinic accepting appointments for this day?</p>
                                    </div>
                                    <Switch
                                        checked={!isClosed}
                                        onCheckedChange={(checked) => setIsClosed(!checked)}
                                    />
                                </div>

                                {!isClosed && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <Label className="text-sm font-black text-gray-900 uppercase tracking-tight">Available Time Blocks</Label>

                                        {slots.map((slot, index) => (
                                            <div key={index} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 relative group">
                                                <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Starts At</Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                                                            <Input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => updateSlotTime(index, 'startTime', e.target.value)}
                                                                className="h-11 pl-10 border-gray-200 focus:border-primary-500 rounded-xl font-bold bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Ends At</Label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
                                                            <Input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => updateSlotTime(index, 'endTime', e.target.value)}
                                                                className="h-11 pl-10 border-gray-200 focus:border-primary-500 rounded-xl font-bold bg-white"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 w-11 mt-6 sm:mt-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                    onClick={() => removeSlot(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl border-dashed border-2 gap-2 text-primary-600 font-bold hover:bg-primary-50 hover:border-primary-200"
                                            onClick={addSlot}
                                        >
                                            <PlusCircle className="h-5 w-5" />
                                            Add Another Time Block
                                        </Button>
                                    </div>
                                )}

                                {isClosed && (
                                    <div className="p-8 bg-red-50 rounded-3xl border border-red-100 text-center space-y-3">
                                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                            <AlertCircle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-red-900">Clinic is CLOSED</h4>
                                            <p className="text-xs text-red-700 leading-relaxed mt-1">
                                                No slots will be generated. This day will be completely blocked for all patients.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-xl text-gray-600 font-bold border-gray-300 hover:bg-white hover:text-red-600 hover:border-red-200"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Reset Day
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-[2] h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-200"
                                >
                                    {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Variations</>}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
