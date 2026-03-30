"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Calendar,
    User,
    Clock,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    X,
    Menu,
    FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { useLanguage } from "@/lib/LanguageContext"
import { useState, useRef, useEffect } from "react"
import { signOut } from "next-auth/react"
import { Globe, ChevronDown } from "lucide-react"

export function DashboardSidebar({
    role,
    isOpen,
    onClose
}: {
    role: string,
    isOpen: boolean,
    onClose: () => void
}) {
    const pathname = usePathname()
    const { t, language, setLanguage } = useLanguage()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isLangOpen, setIsLangOpen] = useState(false)
    const langRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const allMenuItems = [
        {
            title: t('dashboard.overview'),
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: t('dashboard.bookings'),
            href: "/dashboard/bookings",
            icon: Calendar,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: t('dashboard.profile'),
            href: "/dashboard/profile",
            icon: User,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: t('dashboard.availability'),
            href: "/dashboard/availability",
            icon: Clock,
            roles: ["DENTIST"]
        },
        {
            title: t('dashboard.services'),
            href: "/dashboard/services",
            icon: Stethoscope,
            roles: ["DENTIST"]
        },
        {
            title: t('dashboard.my_articles'),
            href: "/dashboard/blog",
            icon: FileText,
            roles: ["DENTIST"]
        },
        {
            title: t('dashboard.settings'),
            href: "/dashboard/settings",
            icon: Settings,
            roles: ["DENTIST", "PATIENT"]
        },
    ]

    const menuItems = allMenuItems.filter(item => item.roles.includes(role))

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col",
                    isCollapsed ? "lg:w-20" : "lg:w-64",
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    {(!isCollapsed || isOpen) && <Logo />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (window.innerWidth < 1024) {
                                onClose()
                            } else {
                                setIsCollapsed(!isCollapsed)
                            }
                        }}
                        className="ml-auto"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4 hidden lg:block" /> : <ChevronLeft className="h-4 w-4 hidden lg:block" />}
                        <X className="h-5 w-5 lg:hidden" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (window.innerWidth < 1024) {
                                        onClose()
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary-50 text-primary-600"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className={cn(
                                    "h-5 w-5 shrink-0",
                                    isActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-900"
                                )} />
                                {(!isCollapsed || isOpen) && (
                                    <span className="font-medium">{item.title}</span>
                                )}
                                {isActive && (!isCollapsed || isOpen) && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
                    <div className="relative" ref={langRef}>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full flex items-center gap-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                                isCollapsed ? "justify-center px-0" : "justify-start px-3"
                            )}
                            onClick={() => setIsLangOpen(!isLangOpen)}
                        >
                            <Globe className="h-5 w-5" />
                            {(!isCollapsed || isOpen) && (
                                <>
                                    <span className="font-medium uppercase mr-auto">{language}</span>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", isLangOpen && "rotate-180")} />
                                </>
                            )}
                        </Button>

                        {isLangOpen && (
                            <div className={cn(
                                "absolute bottom-full left-0 mb-1 bg-white border border-gray-100 rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95 duration-200 z-50",
                                isCollapsed && !isOpen ? "w-32 left-full ml-1" : "w-full"
                            )}>
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

                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full flex items-center gap-3 text-gray-500 hover:text-red-600 hover:bg-red-50",
                            isCollapsed ? "justify-center px-0" : "justify-start px-3"
                        )}
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="h-5 w-5" />
                        {(!isCollapsed || isOpen) && <span className="font-medium">{t('dashboard.logout')}</span>}
                    </Button>
                </div>
            </aside>
        </>
    )
}
