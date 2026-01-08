"use client"

import Link from "next/link"
import { Stethoscope, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function DentistLoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Column: Login Form */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white">
                <div className="w-full max-w-md mx-auto space-y-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group mb-8">
                        <div className="bg-primary-500 text-white p-2 rounded-lg group-hover:bg-primary-600 transition-colors">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            Dentist<span className="text-primary-500">Anytime</span>
                        </span>
                    </Link>

                    <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 mb-2">
                            For Dentists
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Partner Login</h1>
                        <p className="text-gray-500">Access your practice dashboard and manage appointments</p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Work Email</Label>
                            <Input id="email" placeholder="dr.name@clinic.com" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                    Forgot password?
                                </Link>
                            </div>
                            <Input id="password" type="password" required />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <Label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">
                                Remember me
                            </Label>
                        </div>

                        <Button className="w-full" size="lg">
                            Log In to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">New to DentistAnytime? </span>
                        <Link href="/for-dentists" className="font-medium text-primary-600 hover:text-primary-500">
                            Join our network
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Column: Image/Banner */}
            <div className="hidden lg:block relative bg-gray-900">
                <img
                    src="https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=1200&h=1200"
                    alt="Modern Dental Clinic"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-12 text-white">
                    <h2 className="text-3xl font-bold mb-4">Grow Your Practice</h2>
                    <p className="text-gray-300 text-lg max-w-md leading-relaxed">
                        Join thousands of top-rated dentists who trust DentistAnytime to manage their appointments and grow their patient base.
                    </p>
                </div>
            </div>
        </div>
    )
}
