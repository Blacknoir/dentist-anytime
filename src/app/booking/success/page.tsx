"use client"

import Link from "next/link"
import { CheckCircle2, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-600 mb-8">
                    Your appointment has been successfully scheduled. We've sent a confirmation email to your inbox.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left space-y-4">
                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">Wed, Oct 14 • 10:00 AM</p>
                            <p className="text-sm text-gray-500">Dental Checkup</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary-500 mt-0.5" />
                        <div>
                            <p className="font-medium text-gray-900">Dr. Sarah Wilson</p>
                            <p className="text-sm text-gray-500">Downtown Dental, NY</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/">
                        <Button className="w-full">Return to Home</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button variant="outline" className="w-full">View My Appointments</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
