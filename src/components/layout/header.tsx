"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, Stethoscope } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Header() {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

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
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="bg-primary-500 text-white p-2 rounded-lg group-hover:bg-primary-600 transition-colors">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            Dentist<span className="text-primary-500">Anytime</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            href="/search"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            Find a Dentist
                        </Link>
                        <Link
                            href="/services"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            Services
                        </Link>
                        <Link
                            href="/for-dentists"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            For Dentists
                        </Link>
                        <Link
                            href="/blog"
                            className="text-sm font-medium text-gray-600 hover:text-primary-500 transition-colors"
                        >
                            Blog
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-gray-600" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/search">Book Appointment</Link>
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
                        Find a Dentist
                    </Link>
                    <Link
                        href="/services"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Services
                    </Link>
                    <Link
                        href="/for-dentists"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        For Dentists
                    </Link>
                    <Link
                        href="/blog"
                        className="text-sm font-medium text-gray-600 py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        Blog
                    </Link>
                    <div className="flex flex-col gap-2 mt-2">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full justify-center">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full justify-center">Book Appointment</Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
