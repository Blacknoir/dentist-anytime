"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Valid phone number is required"),
})

export type PatientFormData = z.infer<typeof formSchema>

interface StepInfoProps {
    onSubmit: (data: PatientFormData) => void
    defaultValues?: Partial<PatientFormData>
}

export function StepInfo({ onSubmit, defaultValues }: StepInfoProps) {
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Details</h2>

            <form id="patient-info-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...register("firstName")} placeholder="John" />
                        {errors.firstName && (
                            <p className="text-sm text-red-500">{errors.firstName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...register("lastName")} placeholder="Doe" />
                        {errors.lastName && (
                            <p className="text-sm text-red-500">{errors.lastName.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="john@example.com" />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" {...register("phone")} placeholder="(555) 123-4567" />
                    {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                </div>
            </form>
        </div>
    )
}
