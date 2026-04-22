"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingSteps } from "@/components/booking/booking-steps"
import { StepService } from "@/components/booking/step-service"
import { StepTime } from "@/components/booking/step-time"
import { StepInfo, type PatientFormData } from "@/components/booking/step-info"
import { StripePayment } from "@/components/booking/stripe-payment"
import { createBooking } from "@/app/actions/booking"
import { useLanguage } from "@/lib/LanguageContext"

interface BookingClientProps {
    dentist: any
    preselectedDate?: string
    preselectedTime?: string
    preselectedService?: string
}

export function BookingClient({ dentist, preselectedDate, preselectedTime, preselectedService }: BookingClientProps) {
    const { t } = useLanguage()
    const router = useRouter()
    const [currentStep, setCurrentStep] = React.useState(1)

    const [bookingData, setBookingData] = React.useState({
        service: preselectedService || null as string | null,
        date: preselectedDate || t('pages.booking.mock_date').split(' • ')[0],
        time: preselectedTime || t('pages.booking.mock_date').split(' • ')[1],
        patient: null as PatientFormData | null,
    })

    const [paymentIntentId, setPaymentIntentId] = React.useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const dentistId = dentist.id
    const consultationFee = dentist.priceFrom

    const handleNext = async () => {
        if (currentStep === 3) {
            const form = document.getElementById("patient-info-form") as HTMLFormElement
            if (form) form.requestSubmit()
        } else if (currentStep === 4) {
            setCurrentStep(5)
        } else {
            setCurrentStep((prev) => prev + 1)
        }
    }

    const handlePaymentSuccess = async (id: string) => {
        setPaymentIntentId(id)
        setIsSubmitting(true)
        try {
            // Build the actual booking date from selected date + time
            let bookingDate: Date
            if (bookingData.date && bookingData.time) {
                const [hours, minutes] = bookingData.time.split(':').map(Number)
                bookingDate = new Date(bookingData.date)
                if (!isNaN(hours) && !isNaN(minutes)) {
                    bookingDate.setHours(hours, minutes, 0, 0)
                }
            } else {
                bookingDate = new Date()
            }

            await createBooking({
                dentistProfileId: dentistId,
                serviceName: bookingData.service || "Consultation",
                date: bookingDate,
                ...({ stripePaymentId: id } as any)
            })
        } catch (error) {
            console.error("Booking record creation failed (payment was successful):", error)
            // Payment already went through, so we still redirect to success
        } finally {
            // Always redirect to success - the payment was already captured
            router.push("/booking/success")
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
        <div className="min-h-screen bg-transparent flex flex-col items-center py-6 px-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                <div className="bg-white border-b border-gray-50 p-6 md:p-8 relative">
                    <button
                        onClick={() => router.push(`/dentist/${dentistId}`)}
                        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label={t('pages.booking.cancel') || 'Cancel booking'}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-center text-gray-900 mb-2">
                        {t('pages.booking.title')}
                    </h1>
                    <p className="text-center text-gray-500 text-sm mb-8">
                        Booking with <span className="font-bold text-primary-600">{dentist.user.name}</span>
                    </p>
                    <BookingSteps currentStep={currentStep} />
                </div>

                <div className="p-6 md:p-10 min-h-[450px]">
                    {currentStep === 1 && (
                        <StepService
                            selectedService={bookingData.service}
                            onSelect={(service) => setBookingData({ ...bookingData, service })}
                            services={dentist.services}
                            consultationFee={consultationFee}
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
                            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Service</span>
                                        <p className="font-bold text-gray-900">{bookingData.service || "Consultation"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Date & Time</span>
                                        <p className="font-bold text-gray-900">{bookingData.date}, {bookingData.time}</p>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Patient</span>
                                        <p className="font-bold text-gray-900">
                                            {bookingData.patient?.firstName} {bookingData.patient?.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500">{bookingData.patient?.email}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-6 flex flex-col items-end gap-3">
                                    <div className="flex justify-between items-center w-full">
                                        <span className="font-bold text-gray-900">{t('pages.profile.consultation_fee')}</span>
                                        <span className="text-3xl font-black text-primary-600">€{consultationFee}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-primary-600 bg-primary-50 px-4 py-2 rounded-xl border border-primary-100 inline-block">
                                            {t('pages.profile.consultation_fee')} required for booking
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2 italic max-w-xs ml-auto">
                                            *All other treatment costs will be settled at the clinic.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
                                <p className="text-gray-500">Secure payment of €{consultationFee} for your consultation.</p>
                            </div>
                            <StripePayment
                                amount={consultationFee * 100}
                                dentistProfileId={dentistId}
                                onSuccess={handlePaymentSuccess}
                            />
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-8 space-y-2">
                                <p className="text-xs text-gray-500 text-center font-medium">
                                    {t('booking.cancel_policy')}
                                </p>
                                <p className="text-xs text-gray-400 text-center">
                                    Your payment information is encrypted and processed securely. We never store your card details.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-6 md:p-8 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={currentStep === 1 ? "invisible" : "font-bold"}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> {t('pages.booking.back')}
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={(currentStep === 1 && !bookingData.service) || currentStep === 5 || isSubmitting}
                            className="px-8 shadow-lg shadow-primary-500/20 font-bold"
                        >
                            {currentStep === 4 ? "Proceed to Payment" : t('pages.booking.continue')}
                            {currentStep < 4 && <ChevronRight className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
