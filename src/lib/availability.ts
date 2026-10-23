import { addDays, format, isSameDay, startOfToday } from "date-fns"

export interface WeeklyAvailability {
    dayOfWeek: number
    startTime: string
    endTime: string
}

export interface AvailabilityException {
    date: Date | string
    isClosed: boolean
    startTime: string | null
    endTime: string | null
}

export interface AvailabilitySource {
    availability?: WeeklyAvailability[] | null
    exceptions?: AvailabilityException[] | null
}

export interface AvailabilityBlock {
    startTime: string
    endTime: string
}

export function toDateKey(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

function exceptionDateKey(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value)
    return date.toISOString().slice(0, 10)
}

export function getDayBlocks(dentist: AvailabilitySource, date: Date): AvailabilityBlock[] {
    const dateKey = toDateKey(date)
    const exceptions = (dentist.exceptions || []).filter(
        (exception) => exceptionDateKey(exception.date) === dateKey
    )

    if (exceptions.length > 0) {
        if (exceptions.some((exception) => exception.isClosed)) return []
        return exceptions
            .filter((exception) => exception.startTime && exception.endTime)
            .map((exception) => ({
                startTime: exception.startTime as string,
                endTime: exception.endTime as string,
            }))
    }

    const dayOfWeek = date.getDay()
    return (dentist.availability || [])
        .filter((block) => block.dayOfWeek === dayOfWeek && block.startTime && block.endTime)
        .map((block) => ({ startTime: block.startTime, endTime: block.endTime }))
}

export function getDaySlots(
    dentist: AvailabilitySource,
    date: Date,
    now: Date = new Date()
): AvailabilityBlock[] {
    const isToday = isSameDay(date, now)

    return getDayBlocks(dentist, date)
        .filter((block) => {
            if (!isToday) return true
            const [hours, minutes] = block.startTime.split(":").map(Number)
            const start = new Date(date)
            start.setHours(hours, minutes, 0, 0)
            return start > now
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function isSlotAvailable(
    dentist: AvailabilitySource,
    date: Date,
    time: string,
    now: Date = new Date()
): boolean {
    return getDaySlots(dentist, date, now).some((slot) => slot.startTime === time)
}

export function hasAnyAvailability(
    dentist: AvailabilitySource,
    options?: { now?: Date; daysAhead?: number }
): boolean {
    const now = options?.now ?? new Date()
    const daysAhead = options?.daysAhead ?? 60
    const today = startOfToday()

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
        if (getDaySlots(dentist, addDays(today, dayOffset), now).length > 0) return true
    }

    return false
}

export function buildAppointmentDate(dateKey: string, time: string): Date | null {
    const dateParts = dateKey.split("-").map(Number)
    const timeParts = time.split(":").map(Number)
    if (dateParts.length !== 3 || timeParts.length !== 2) return null

    const [year, month, day] = dateParts
    const [hours, minutes] = timeParts
    if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) return null

    const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
    const isValid =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day &&
        date.getHours() === hours &&
        date.getMinutes() === minutes

    return isValid ? date : null
}
