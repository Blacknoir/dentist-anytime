"use client"

import Link from "next/link"
import { Stethoscope, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
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
                        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                        <p className="text-gray-500">Enter your email to sign in to your account</p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="name@example.com" type="email" required />
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
                                Remember me for 30 days
                            </Label>
                        </div>

                        <Button className="w-full" size="lg">
                            Sign In <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">Don't have an account? </span>
                        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right Column: Image/Banner */}
            <div className="hidden lg:block relative bg-gray-100">
                <div className="absolute inset-0 bg-primary-600/10 mix-blend-multiply" />
                <img
                    src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200&h=1200"
                    alt="Dental Office"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <blockquote className="space-y-4 max-w-lg">
                        <p className="text-2xl font-medium leading-relaxed">
                            "DentistAnytime has completely transformed how I manage my dental health. Booking appointments is now effortless."
                        </p>
                        <footer className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
                                JD
                            </div>
                            <div>
                                <div className="font-semibold">Jane Doe</div>
                                <div className="text-white/80 text-sm">Patient since 2023</div>
                            </div>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
