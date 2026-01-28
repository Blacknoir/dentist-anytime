"use client"

import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useLanguage } from "@/lib/LanguageContext"
import { signInWithGoogle, signInWithFacebook } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import * as React from "react"

export default function RegisterPage() {
    const { t } = useLanguage()

    const [role, setRole] = React.useState<"PATIENT" | "DENTIST">("PATIENT")

    return (
        <div className="min-h-screen grid lg:grid-cols-2 relative">
            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm lg:bg-transparent lg:border-none lg:shadow-none"
            >
                <ArrowLeft className="h-4 w-4" />
                {t('pages.return_home')}
            </Link>

            {/* Left Column: Register Form */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white overflow-y-auto">
                <div className="w-full max-w-md mx-auto space-y-8 my-8">
                    <Logo className="mb-8" />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900">{t('pages.login.sign_up')}</h1>
                            <p className="text-gray-500">{t('pages.login.desc')}</p>
                        </div>

                        {/* Role Selection */}
                        <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                            <button
                                onClick={() => setRole("PATIENT")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                    role === "PATIENT" ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {t('search.find_dentist')}
                            </button>
                            <button
                                onClick={() => setRole("DENTIST")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                    role === "DENTIST" ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {t('nav.for_dentists')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <form action={() => signInWithGoogle(role)}>
                            <Button variant="outline" className="w-full h-12 text-base font-medium" type="submit">
                                <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                {t('pages.login.continue_google')}
                            </Button>
                        </form>
                        <form action={() => signInWithFacebook(role)}>
                            <Button variant="outline" className="w-full h-12 text-base font-medium" type="submit">
                                <svg className="mr-3 h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
                                </svg>
                                {t('pages.login.continue_facebook')}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">{t('pages.login.already_account')} </span>
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            {t('nav.sign_in')}
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
                            {t('pages.login.quote')}
                        </p>
                        <footer className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
                                JD
                            </div>
                            <div>
                                <div className="font-semibold">Jane Doe</div>
                                <div className="text-white/80 text-sm">{t('pages.login.patient_since')} 2023</div>
                            </div>
                        </footer>
                    </blockquote>
                </div>
            </div>
        </div>
    )
}
