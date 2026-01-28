"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDentistsForReview, verifyDentist, getAllDentists } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, ExternalLink, ShieldCheck, Mail, Database } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const [dentists, setDentists] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"PENDING" | "ALL">("PENDING")
    const router = useRouter()

    useEffect(() => {
        if (status === "loading") return

        if (!session || (session.user as any).role !== "ADMIN") {
            router.push("/admin/login")
            return
        }
        loadDentists()
    }, [session, status, viewMode])

    const loadDentists = async () => {
        setLoading(true)
        try {
            const data = viewMode === "PENDING" ? await getDentistsForReview() : await getAllDentists()
            setDentists(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (id: string, status: boolean) => {
        try {
            await verifyDentist(id, status)
            alert(status ? "Dentist verified!" : "Verification rejected")
            loadDentists()
        } catch (error) {
            alert("Action failed")
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full h-auto">
                <div className="max-w-7xl mx-auto px-4 py-3 md:h-16 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/" className="hover:opacity-80 transition-opacity whitespace-nowrap">
                        <h1 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-primary-600" />
                            Admin Control
                        </h1>
                    </Link>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                            variant={viewMode === "PENDING" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("PENDING")}
                        >
                            Pending Review
                        </Button>
                        <Button
                            variant={viewMode === "ALL" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("ALL")}
                        >
                            All Dentists
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => signOut({ callbackUrl: "/admin/login" })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : dentists.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No dentists found</h3>
                        <p className="text-gray-500">There are no dentist profiles matching this criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dentists.map((dentist) => (
                            <Card key={dentist.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <CardHeader className="bg-white border-b border-gray-50 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                                            {dentist.user.image ? (
                                                <Image src={dentist.user.image} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-bold">
                                                    {dentist.user.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold">{dentist.user.name}</CardTitle>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Mail className="h-3 w-3" />
                                                {dentist.user.email}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Specialty</span>
                                        <p className="text-sm font-medium">{dentist.specialty}</p>
                                    </div>

                                    {dentist.degreeImage ? (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Degree Document</span>
                                            <div className="relative h-40 w-full rounded-lg border border-gray-200 overflow-hidden group">
                                                <Image
                                                    src={dentist.degreeImage}
                                                    alt="Degree"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <a
                                                    href={dentist.degreeImage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                                >
                                                    <ExternalLink className="h-6 w-6" />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 border border-dashed border-gray-200 text-center">
                                            No degree document uploaded
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        {!dentist.isVerified ? (
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                                                onClick={() => handleVerify(dentist.id, true)}
                                            >
                                                <Check className="h-4 w-4" /> Approve
                                            </Button>
                                        ) : (
                                            <Button
                                                className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 gap-2 border-none"
                                                onClick={() => handleVerify(dentist.id, false)}
                                            >
                                                <X className="h-4 w-4" /> Unverify
                                            </Button>
                                        )}
                                        {viewMode === "PENDING" && (
                                            <Button
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleVerify(dentist.id, false)}
                                            >
                                                Reject
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
