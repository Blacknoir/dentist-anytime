"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingSteps } from "@/components/booking/booking-steps"
import { StepService } from "@/components/booking/step-service"
import { StepTime } from "@/components/booking/step-time"
import { StepInfo, type PatientFormData } from "@/components/booking/step-info"
import { useLanguage } from "@/lib/LanguageContext"

export default function BookingPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [currentStep, setCurrentStep] = React.useState(1)

    const formatTime = (time: string) => {
        return time.replace("AM", t('time.am')).replace("PM", t('time.pm'))
    }

    const [bookingData, setBookingData] = React.useState({
        service: null as string | null,
        date: t('pages.booking.mock_date').split(' • ')[0],
        time: t('pages.booking.mock_date').split(' • ')[1],
        patient: null as PatientFormData | null,
    })

    const handleNext = () => {
        if (currentStep === 3) {
            // Trigger form submission from outside (handled by ref or state in real app)
            // For this demo, we'll rely on the form's onSubmit prop
            const form = document.getElementById("patient-info-form") as HTMLFormElement
            if (form) form.requestSubmit()
        } else if (currentStep === 4) {
            router.push("/booking/success")
        } else {
            setCurrentStep((prev) => prev + 1)
        }
    }

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1)
    }

    const handlePatientInfoSubmit = (data: PatientFormData) => {
        setBookingData((prev) => ({ ...prev, patient: data }))
        setCurrentStep((prev) => prev + 1)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-white border-b border-gray-100 p-6">
                    <h1 className="text-2xl font-bold text-center text-gray-900">{t('pages.booking.title')}</h1>
                    <BookingSteps currentStep={currentStep} />
                </div>

                <div className="p-6 md:p-8 min-h-[400px]">
                    {currentStep === 1 && (
                        <StepService
                            selectedService={bookingData.service}
                            onSelect={(service) => setBookingData({ ...bookingData, service })}
                        />
                    )}
                    {currentStep === 2 && (
                        <StepTime
                            selectedDate={bookingData.date}
                            selectedTime={bookingData.time}
                        />
                    )}
                    {currentStep === 3 && (
                        <StepInfo
                            onSubmit={handlePatientInfoSubmit}
                            defaultValues={bookingData.patient || {}}
                        />
                    )}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.booking.review_confirm')}</h2>
                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('pages.booking.service')}</span>
                                    <span className="font-medium text-gray-900">{t('pages.booking.mock_service')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('pages.booking.date_time')}</span>
                                    <span className="font-medium text-gray-900">{bookingData.date}, {bookingData.time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t('pages.booking.patient')}</span>
                                    <span className="font-medium text-gray-900">
                                        {bookingData.patient?.firstName} {bookingData.patient?.lastName}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                                    <span className="font-semibold text-gray-900">{t('pages.booking.total')}</span>
                                    <span className="text-xl font-bold text-primary-600">$50.00</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={currentStep === 1 ? "invisible" : ""}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" /> {t('pages.booking.back')}
                    </Button>

                    {currentStep === 3 ? (
                        <Button onClick={handleNext}>
                            {t('pages.booking.continue')} <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            disabled={currentStep === 1 && !bookingData.service}
                        >
                            {currentStep === 4 ? t('pages.booking.confirm_booking') : t('pages.booking.continue')}
                            {currentStep !== 4 && <ChevronRight className="h-4 w-4 ml-2" />}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
