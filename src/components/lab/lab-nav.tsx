"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { ArrowLeft, Briefcase, LayoutDashboard, Menu, PlusCircle, ShieldCheck, Store, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/logo"
import { cn } from "@/lib/utils"

const LINKS = [
    { href: "/lab", label: "Επισκόπηση", icon: LayoutDashboard, exact: true },
    { href: "/lab/cases", label: "Εργασίες", icon: Briefcase },
    { href: "/lab/designers", label: "CAD Designers", icon: Users },
    { href: "/lab/labs", label: "Εργαστήρια", icon: Store },
    { href: "/lab/legal", label: "Συμμόρφωση", icon: ShieldCheck },
]

export function LabNav() {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [openPath, setOpenPath] = useState<string | null>(null)
    const menuOpen = openPath === pathname
    const role = (session?.user as { role?: string } | undefined)?.role
    const isDesigner = role === "DESIGNER"
    const isCustomer = role === "DENTIST" || role === "LAB"
    const closeMenu = () => setOpenPath(null)
    const profileHref = role === "ADMIN" ? "/lab/admin"
        : role === "DENTIST" ? "/dashboard/profile"
        : isDesigner || role === "LAB" ? "/lab/designer/profile" : "/dashboard"
    const workHref = isDesigner ? "/lab/designer" : "/lab/cases?scope=mine"

    const navigation = (
        <>
            {LINKS.map((link) => {
                const active = link.exact ? pathname === link.href
                    : pathname === link.href || pathname.startsWith(link.href + "/")
                const Icon = link.icon
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium",
                            active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                    </Link>
                )
            })}
            {(isDesigner || isCustomer) && (
                <Link
                    href={workHref}
                    onClick={closeMenu}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                    <Briefcase className="h-4 w-4 shrink-0" /> Οι εργασίες μου
                </Link>
            )}
        </>
    )

    return (
        <header
            className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md"
            onKeyDown={(event) => { if (event.key === "Escape") closeMenu() }}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex min-h-16 items-center justify-between gap-3">
                    <div className="flex shrink-0 items-center gap-2">
                        <Logo imageClassName="h-8 w-8" />
                        <Link href="/lab" onClick={closeMenu} className="border-l border-gray-200 pl-2 text-sm font-semibold text-primary-700">
                            Lab
                        </Link>
                    </div>
                    <nav aria-label="Πλοήγηση Lab" className="hidden items-center gap-0.5 xl:flex">
                        {navigation}
                    </nav>
                    <div className="flex shrink-0 items-center gap-2">
                        {isCustomer && (
                            <Button size="sm" asChild>
                                <Link href="/lab/new" onClick={closeMenu} aria-label="Νέα εργασία">
                                    <PlusCircle className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Νέα εργασία</span>
                                </Link>
                            </Button>
                        )}
                        {status === "authenticated" ? (
                            <Button size="sm" variant="outline" asChild className="hidden xl:inline-flex">
                                <Link href={profileHref}>Το προφίλ μου</Link>
                            </Button>
                        ) : status === "unauthenticated" && (
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/lab/login" onClick={closeMenu}>Σύνδεση</Link>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={menuOpen ? "Κλείσιμο μενού Lab" : "Άνοιγμα μενού Lab"}
                            aria-expanded={menuOpen}
                            aria-controls="lab-menu"
                            onClick={() => setOpenPath(menuOpen ? null : pathname)}
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
                {menuOpen && (
                    <div id="lab-menu" className="border-t border-gray-100 py-3">
                        <nav aria-label="Μενού Lab" className="grid grid-cols-2 gap-1 xl:hidden">
                            {navigation}
                        </nav>
                        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 mt-2">
                            <Link href="/" onClick={closeMenu} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
                                <ArrowLeft className="h-4 w-4" /> Επιστροφή στη Dentora
                            </Link>
                            {status === "authenticated" && (
                                <>
                                    <Button size="sm" variant="outline" asChild>
                                        <Link href={profileHref} onClick={closeMenu}>Το προφίλ μου</Link>
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: "/lab" })}>
                                        Αποσύνδεση
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
