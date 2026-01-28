"use client"

import { useState } from "react"
import { DashboardSidebar } from "./sidebar"
import { Button } from "@/components/ui/button"
import { Menu, Bell, User } from "lucide-react"
import { LanguageProvider } from "@/lib/LanguageContext"

export function DashboardShell({
    children,
    role,
    userName
}: {
    children: React.ReactNode,
    role: string,
    userName?: string | null
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <LanguageProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
                <DashboardSidebar
                    role={role}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    {/* Mobile Header */}
                    <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </Button>
                        <div className="font-bold text-lg text-primary-600">Dentora</div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-gray-500">
                                <Bell className="h-5 w-5" />
                            </Button>
                        </div>
                    </header>

                    <main className="flex-1 lg:ml-64 transition-all duration-300">
                        <div className="p-4 md:p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </LanguageProvider>
    )
}
