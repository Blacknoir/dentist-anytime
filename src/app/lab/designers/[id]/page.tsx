import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BadgeCheck, Euro, MapPin, Package, Timer, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Stars } from "@/components/lab/lab-components"
import { codeInitials, euros } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function DesignerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const designer = await prisma.designerProfile.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, publicCode: true, image: true } },
            services: { where: { isActive: true }, orderBy: { price: "asc" } },
        },
    })

    if (!designer) notFound()

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <Link href="/lab/designers" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Όλοι οι designers
                </Link>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-xl font-bold">
                            {codeInitials(designer.user?.publicCode)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    CAD Designer #{designer.user?.publicCode}
                                </h1>
                                {designer.isVerified && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                        <BadgeCheck className="h-3 w-3" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-600 mt-1">{designer.headline}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                {designer.reviewCount > 0 && <Stars rating={designer.rating} count={designer.reviewCount} />}
                                <span className="inline-flex items-center gap-1">
                                    <Package className="h-4 w-4" /> {designer.completedCases} ολοκληρωμένες εργασίες
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Timer className="h-4 w-4" /> ~{designer.avgLeadTimeDays} ημέρες
                                </span>
                                {designer.city && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-4 w-4" /> {designer.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button size="lg" asChild>
                        <Link href={`/lab/new?designer=${designer.id}`}>
                            Ανάθεση εργασίας
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Υπηρεσίες & τιμές</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {designer.services.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        Ο designer δεν έχει δηλώσει υπηρεσίες ακόμα. Στείλε του μια εργασία και ζήτησε
                                        προσφορά.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {designer.services.map((service) => (
                                            <div key={service.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                                <div>
                                                    <div className="font-bold text-gray-900">{service.name}</div>
                                                    {service.description && (
                                                        <p className="text-sm text-gray-600 mt-0.5">{service.description}</p>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Παράδοση σε {service.leadTimeDays} ημέρες
                                                        {service.minUnits > 1 && ` · από ${service.minUnits} τεμάχια`}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 font-bold text-gray-900 text-lg">
                                                    <Euro className="h-4 w-4" />
                                                    {euros(service.price)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {designer.bio && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Παρουσίαση</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{designer.bio}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Πώς λειτουργεί η ανάθεση</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-gray-600">
                                {[
                                    "Δημιουργείς εργασία με τις παραμέτρους σου και ανεβάζεις τη σάρωση.",
                                    "Ο designer βλέπει την εργασία στο board και στέλνει προσφορά.",
                                    "Διαλέγεις την προσφορά σου και πληρώνεις με ασφάλεια (escrow).",
                                    "Ο designer παραδίδει τα αρχεία και εσύ εγκρίνεις ή ζητάς διόρθωση.",
                                ].map((step, index) => (
                                    <div key={step} className="flex gap-3">
                                        <span className="h-6 w-6 shrink-0 rounded-full bg-primary-50 text-primary-700 text-xs font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                                    <UserRound className="h-5 w-5" />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Οι προσφορές στέλνονται από τον ίδιο τον designer. Οι τιμές είναι αυτές που έχει
                                    δηλώσει στο προφίλ του.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
