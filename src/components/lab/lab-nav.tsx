"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Briefcase, LayoutDashboard, PlusCircle, ShieldCheck, Store, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const LINKS = [
    { href: "/lab", label: "Επισκόπηση", icon: LayoutDashboard, exact: true },
    { href: "/lab/cases", label: "Εργασίες", icon: Briefcase },
    { href: "/lab/designers", label: "CAD Designers", icon: Users },
    { href: "/lab/labs", label: "Εργαστήρια", icon: Store },
]

export function LabNav() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const role = (session?.user as any)?.role as string | undefined
    const isDesigner = role === "DESIGNER"

    return (
        <div className="sticky top-16 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between gap-4 h-14 overflow-x-auto">
                    <nav className="flex items-center gap-1 md:gap-2">
                        {LINKS.map((link) => {
                            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
                            const Icon = link.icon
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary-50 text-primary-700"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            )
                        })}
                        {isDesigner && (
                            <Link
                                href="/lab/designer"
                                className={cn(
                                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                                    pathname.startsWith("/lab/designer")
                                        ? "bg-primary-50 text-primary-700"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <Briefcase className="h-4 w-4" />
                                Οι εργασίες μου
                            </Link>
                        )}
                        <Link
                            href="/lab/legal"
                            className={cn(
                                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                                pathname.startsWith("/lab/legal") || pathname.startsWith("/lab/security")
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Συμμόρφωση
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2 shrink-0">
                        {isDesigner ? (
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/lab/designer/profile">Το προφίλ μου</Link>
                            </Button>
                        ) : (
                            <Button size="sm" asChild>
                                <Link href="/lab/new">
                                    <PlusCircle className="h-4 w-4 mr-1" />
                                    Νέα εργασία
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
