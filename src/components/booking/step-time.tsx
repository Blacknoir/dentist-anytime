"use client"

import { Calendar, Clock } from "lucide-react"

interface StepTimeProps {
    selectedDate: string
    selectedTime: string
}

export function StepTime({ selectedDate, selectedTime }: StepTimeProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Date & Time</h2>

            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-primary-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-primary-600 font-medium mb-1">Date</p>
                        <p className="text-lg font-bold text-gray-900">{selectedDate}</p>
                    </div>
                </div>

                <div className="w-full h-px bg-primary-200/50 my-4" />

                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm text-primary-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-primary-600 font-medium mb-1">Time</p>
                        <p className="text-lg font-bold text-gray-900">{selectedTime}</p>
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-500 text-center">
                You can change this in the previous step if needed.
            </p>
        </div>
    )
}
