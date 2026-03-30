"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/LanguageContext"
import { format, addDays, startOfToday, isSameDay } from "date-fns"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface AvailabilityCalendarProps {
    dentist: any
}

export function AvailabilityCalendar({ dentist }: AvailabilityCalendarProps) {
    const { t } = useLanguage()
    const { data: session } = useSession()
    const router = useRouter()

    // Dynamic date management
    const [startDate, setStartDate] = React.useState(startOfToday())
    const [selectedDate, setSelectedDate] = React.useState(startOfToday())
    const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null)

    // Generate 7 days from startDate
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

    // Dynamic time slot generator
    const generateSlots = (date: Date) => {
        const dateString = format(date, "yyyy-MM-dd")
        const dateExceptions = dentist.exceptions?.filter((e: any) => {
            const eDate = new Date(e.date)
            return eDate.toISOString().split('T')[0] === dateString
        }) || []

        const dayOfWeek = date.getDay()
        const weeklyAvails = dentist.availability?.filter((a: any) => a.dayOfWeek === dayOfWeek) || []

        // Logic for determining blocks
        let blocks: { startTime: string, endTime: string }[] = []

        if (dateExceptions.length > 0) {
            // Check if any exception marks the day as closed
            if (dateExceptions.some((e: any) => e.isClosed)) return []
            blocks = dateExceptions.map((e: any) => ({ startTime: e.startTime, endTime: e.endTime }))
        } else {
            blocks = weeklyAvails.map((a: any) => ({ startTime: a.startTime, endTime: a.endTime }))
        }

        if (blocks.length === 0) return []

        const now = new Date()
        const allSlots: any[] = []

        blocks.forEach(block => {
            if (!block.startTime || !block.endTime) return

            // Create date objects for comparison
            const [startH, startM] = block.startTime.split(':').map(Number)
            const slotStart = new Date(date)
            slotStart.setHours(startH, startM, 0, 0)

            const isTodayDay = isSameDay(date, now)
            if (!isTodayDay || slotStart > now) {
                // Use a helper to format the display range
                const formatTimeStr = (t: string) => {
                    const [h, m] = t.split(':').map(Number)
                    const d = new Date()
                    d.setHours(h, m, 0, 0)
                    return format(d, "hh:mm a")
                }

                allSlots.push({
                    time: block.startTime,
                    display: `${formatTimeStr(block.startTime)} - ${formatTimeStr(block.endTime)}`,
                    available: true
                })
            }
        })

        // Sort slots by time
        return allSlots.sort((a, b) => a.time.localeCompare(b.time))
    }

    const slots = React.useMemo(() => generateSlots(selectedDate), [selectedDate, dentist])

    const handleBook = async () => {
        if (!session) {
            router.push("/login")
            return
        }

        if (!selectedSlot) return

        // Redirect to the booking page with the selected time and date
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const serviceName = dentist.services?.[0]?.name || "General Consultation"
        router.push(`/booking?dentistId=${dentist.id}&date=${dateStr}&time=${selectedSlot}&service=${encodeURIComponent(serviceName)}`)
    }

    const nextWeek = () => setStartDate(prev => addDays(prev, 7))
    const prevWeek = () => {
        const newDate = addDays(startDate, -7)
        if (newDate >= startOfToday()) setStartDate(newDate)
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{t('pages.profile.book_appointment')}</h2>
                    <p className="text-xs text-gray-500 mt-1">{t(`months.${format(startDate, 'MMMM').toLowerCase() === 'may' ? 'may_full' : format(startDate, 'MMMM').toLowerCase()}`)} {format(startDate, 'yyyy')}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={prevWeek}
                        disabled={isSameDay(startDate, startOfToday())}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={nextWeek}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Date Selector */}
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-4 overflow-x-auto gap-2">
                {weekDays.map((date) => (
                    <button
                        key={date.toISOString()}
                        onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlot(null)
                        }}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[50px]",
                            isSameDay(selectedDate, date)
                                ? "bg-primary-500 text-white shadow-lg scale-105"
                                : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        <span className="text-[10px] font-bold uppercase opacity-80">{t(`days.${format(date, 'EEE').toLowerCase()}`)}</span>
                        <span className="text-sm font-black">{format(date, "d")}</span>
                    </button>
                ))}
            </div>

            {/* Time Slots */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                    <CalendarIcon className="h-4 w-4 text-primary-500" />
                    <span>{t(`days.${format(selectedDate, 'eeee').toLowerCase()}`)}, {t(`months.${format(selectedDate, 'MMMM').toLowerCase() === 'may' ? 'may_full' : format(selectedDate, 'MMMM').toLowerCase()}`)} {format(selectedDate, 'd')}</span>
                </div>

                {slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {slots.map((slot, index) => (
                            <button
                                key={index}
                                disabled={!slot.available}
                                onClick={() => setSelectedSlot(slot.time)}
                                className={cn(
                                    "py-2.5 px-1 text-xs font-bold rounded-xl border transition-all",
                                    !slot.available
                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                        : selectedSlot === slot.time
                                            ? "bg-primary-500 text-white border-primary-500 shadow-md"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-primary-500 hover:text-primary-600"
                                )}
                            >
                                {slot.display}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">{t('pages.profile.no_availability')}</p>
                    </div>
                )}
            </div>

            <Button
                className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary-100"
                size="lg"
                disabled={!selectedSlot || !dentist.isStripeEnabled}
                onClick={handleBook}
            >
                {!dentist.isStripeEnabled ? t('pages.profile.booking_unavailable') : selectedSlot ? `${t('pages.profile.book_for')} ${selectedSlot}` : t('pages.profile.select_time')}
            </Button>

            <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed uppercase tracking-tighter">
                {t('pages.profile.secure_payment')}
            </p>
        </div>
    )
}

