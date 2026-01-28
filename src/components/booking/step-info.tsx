"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/LanguageContext"

export type PatientFormData = {
    firstName: string
    lastName: string
    email: string
    phone: string
}

interface StepInfoProps {
    onSubmit: (data: PatientFormData) => void
    defaultValues?: Partial<PatientFormData>
}

export function StepInfo({ onSubmit, defaultValues }: StepInfoProps) {
    const { t } = useLanguage()

    const formSchema = z.object({
        firstName: z.string().min(2, t('pages.booking.first_name') + " " + t('pages.booking.required')),
        lastName: z.string().min(2, t('pages.booking.last_name') + " " + t('pages.booking.required')),
        email: z.string().email(t('pages.booking.invalid_email')),
        phone: z.string().min(10, t('pages.booking.invalid_phone')),
    })

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PatientFormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.booking.patient_details')}</h2>

            <form id="patient-info-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">{t('pages.booking.first_name')}</Label>
                        <Input id="firstName" {...register("firstName")} placeholder={t('pages.booking.placeholder_first_name')} />
                        {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">{t('pages.booking.last_name')}</Label>
                        <Input id="lastName" {...register("lastName")} placeholder={t('pages.booking.placeholder_last_name')} />
                        {errors.lastName && (
                            <p className="text-sm text-red-500">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t('pages.booking.email')}</Label>
                    <Input id="email" type="email" {...register("email")} placeholder={t('pages.booking.placeholder_email')} />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">{t('pages.booking.phone')}</Label>
                    <Input id="phone" type="tel" {...register("phone")} placeholder={t('pages.booking.placeholder_phone')} />
                    {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                </div>
            </form>
        </div>
    )
}
