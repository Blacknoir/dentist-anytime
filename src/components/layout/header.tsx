"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, Globe, ChevronDown } from "lucide-react"
import { Logo } from "@/components/shared/logo"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/LanguageContext"
import { useSession, signOut } from "next-auth/react"

export function Header() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const [isLangOpen, setIsLangOpen] = React.useState(false)
    const { language, setLanguage, t } = useLanguage()
    const { data: session } = useSession()

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <Logo />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/search"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            {t('nav.find_dentist')}
                        </Link>
                        <Link
                            href="/services"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            {t('nav.services')}
                        </Link>
                        <Link
                            href="/for-dentists"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            {t('nav.for_dentists')}
                        </Link>
                        <Link
                            href="/blog"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            {t('nav.blog')}
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangOpen(!isLangOpen)}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                            >
                                <Globe className="h-4 w-4" />
                                <span className="uppercase">{language}</span>
                                <ChevronDown className={cn("h-3 w-3 transition-transform", isLangOpen && "rotate-180")} />
                            </button>

                            {isLangOpen && (
                                <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setLanguage('el')
                                            setIsLangOpen(false)
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                                            language === 'el' ? "text-primary-600 font-semibold" : "text-gray-600"
                                        )}
                                    >
                                        Ελληνικά
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLanguage('en')
                                            setIsLangOpen(false)
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                                            language === 'en' ? "text-primary-600 font-semibold" : "text-gray-600"
                                        )}
                                    >
                                        English
                                    </button>
                                </div>
                            )}
                        </div>

                        {session ? (
                            <div className="flex items-center gap-4">
                                {(session.user as any).role === "DENTIST" ? (
                                    <Link
                                        href="/dashboard"
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors px-3 py-1.5 bg-primary-50 rounded-full"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (session.user as any).role === "ADMIN" && (
                                    <Link
                                        href="/admin/dashboard"
                                        className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors px-3 py-1.5 bg-primary-50 rounded-full"
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}
                                <Link
                                    href={(session.user as any).role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="" className="h-8 w-8 rounded-full border border-gray-200" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold uppercase">
                                            {session.user?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-700 hidden lg:block">{session.user?.name}</span>
                                </Link>
                                <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-gray-600">
                                    {t('nav.logout')}
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="sm" className="text-gray-600" asChild>
                                <Link href="/login">{t('nav.sign_in')}</Link>
                            </Button>
                        )}
                        <Button size="sm" asChild>
                            <Link href="/search">{t('nav.book_appointment')}</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-gray-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
                    <Link
                        href="/search"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {t('nav.find_dentist')}
                    </Link>
                    <Link
                        href="/services"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {t('nav.services')}
                    </Link>
                    <Link
                        href="/for-dentists"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {t('nav.for_dentists')}
                    </Link>
                    <Link
                        href="/blog"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        {t('nav.blog')}
                    </Link>

                    {/* Mobile Language Selector */}
                    <div className="flex items-center gap-4 py-2 border-t border-gray-50 mt-2">
                        <button
                            onClick={() => setLanguage('el')}
                            className={cn(
                                "text-sm font-medium px-3 py-1 rounded-full",
                                language === 'el' ? "bg-primary-100 text-primary-600" : "text-gray-600"
                            )}
                        >
                            Ελληνικά
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={cn(
                                "text-sm font-medium px-3 py-1 rounded-full",
                                language === 'en' ? "bg-primary-100 text-primary-600" : "text-gray-600"
                            )}
                        >
                            English
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        {session ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-2 py-2 border-b border-gray-50 mb-2 hover:bg-gray-50 transition-colors rounded-lg"
                                >
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="" className="h-10 w-10 rounded-full border border-gray-200" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold uppercase">
                                            {session.user?.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900">{session.user?.name}</span>
                                        <span className="text-xs text-gray-500">{session.user?.email}</span>
                                    </div>
                                </Link>
                                {(session.user as any).role === "DENTIST" ? (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full"
                                    >
                                        <Button variant="outline" className="w-full justify-center border-primary-200 text-primary-600">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                ) : (session.user as any).role === "ADMIN" && (
                                    <Link
                                        href="/admin/dashboard"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full"
                                    >
                                        <Button variant="outline" className="w-full justify-center border-primary-200 text-primary-600">
                                            Go to Admin Dashboard
                                        </Button>
                                    </Link>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full justify-center"
                                    onClick={() => {
                                        signOut()
                                        setIsMobileMenuOpen(false)
                                    }}
                                >
                                    {t('nav.logout')}
                                </Button>
                            </>
                        ) : (
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="outline" className="w-full justify-center">
                                    {t('nav.sign_in')}
                                </Button>
                            </Link>
                        )}
                        <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full justify-center">{t('nav.book_appointment')}</Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
