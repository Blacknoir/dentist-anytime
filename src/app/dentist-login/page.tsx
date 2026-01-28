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

export default function DentistLoginPage() {
    const { t } = useLanguage()

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

            {/* Left Column: Login Form */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white">
                <div className="w-full max-w-md mx-auto space-y-8">
                    <Logo className="mb-8" />

                    <div className="space-y-2">
                        <div className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 mb-2">
                            {t('nav.for_dentists')}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('pages.dentist_login.title')}</h1>
                        <p className="text-gray-500">{t('pages.dentist_login.desc')}</p>
                    </div>

                    <form className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('pages.dentist_login.email_label')}</Label>
                            <Input id="email" placeholder="dr.name@clinic.com" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('pages.dentist_login.password_label')}</Label>
                                <Link href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                    {t('pages.dentist_login.forgot_password')}
                                </Link>
                            </div>
                            <Input id="password" type="password" required />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <Label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">
                                {t('pages.dentist_login.remember_me')}
                            </Label>
                        </div>

                        <Button className="w-full" size="lg">
                            {t('pages.dentist_login.login_button')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">{t('pages.login.or_continue')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <form action={() => signInWithGoogle("DENTIST")}>
                            <Button variant="outline" className="w-full" type="submit">
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                {t('pages.login.continue_google')}
                            </Button>
                        </form>
                        <form action={() => signInWithFacebook("DENTIST")}>
                            <Button variant="outline" className="w-full" type="submit">
                                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3H13v6.8c4.56-.93 8-4.96 8-9.8z" />
                                </svg>
                                {t('pages.login.continue_facebook')}
                            </Button>
                        </form>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">{t('pages.dentist_login.new_here')} </span>
                        <Link href="/for-dentists" className="font-medium text-primary-600 hover:text-primary-500">
                            {t('pages.dentist_login.join_network')}
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
                    <h2 className="text-3xl font-bold mb-4">{t('pages.dentist_login.grow_title')}</h2>
                    <p className="text-gray-300 text-lg max-w-md leading-relaxed">
                        {t('pages.dentist_login.grow_desc')}
                    </p>
                </div>
            </div>
        </div>
    )
}
