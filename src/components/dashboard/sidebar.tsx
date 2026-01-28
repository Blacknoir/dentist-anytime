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
import { useState } from "react"
import { signOut } from "next-auth/react"

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
    const { t } = useLanguage()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const allMenuItems = [
        {
            title: "Overview",
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: "Bookings",
            href: "/dashboard/bookings",
            icon: Calendar,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: "Profile",
            href: "/dashboard/profile",
            icon: User,
            roles: ["DENTIST", "PATIENT"]
        },
        {
            title: "Availability",
            href: "/dashboard/availability",
            icon: Clock,
            roles: ["DENTIST"]
        },
        {
            title: "Services",
            href: "/dashboard/services",
            icon: Stethoscope,
            roles: ["DENTIST"]
        },
        {
            title: "My Articles",
            href: "/dashboard/blog",
            icon: FileText,
            roles: ["DENTIST"]
        },
        {
            title: "Settings",
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
                <div className="p-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full flex items-center gap-3 text-gray-500 hover:text-red-600 hover:bg-red-50",
                            isCollapsed ? "justify-center px-0" : "justify-start px-3"
                        )}
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="h-5 w-5" />
                        {(!isCollapsed || isOpen) && <span className="font-medium">Logout</span>}
                    </Button>
                </div>
            </aside>
        </>
    )
}
