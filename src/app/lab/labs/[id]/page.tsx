import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Building2, MapPin, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getPortfolio } from "@/lib/lab-portfolio"
import { PortfolioGallery } from "@/components/lab/portfolio-gallery"

export const dynamic = "force-dynamic"

// Public profile of an odontotechnical lab with its portfolio.
export default async function LabProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    const lab = await prisma.labProfile.findUnique({
        where: { id },
        select: {
            id: true,
            labName: true,
            city: true,
            about: true,
            equipment: true,
            materials: true,
            isVerified: true,
            createdAt: true,
        },
    })

    if (!lab) notFound()

    const portfolio = await getPortfolio("LAB", lab.id)

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <Button variant="ghost" size="sm" asChild className="mb-4">
                    <Link href="/lab/labs">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Όλα τα εργαστήρια
                    </Link>
                </Button>

                <Card>
                    <CardContent className="p-6 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary-600" />
                                    {lab.labName}
                                </h1>
                                {lab.city && (
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" /> {lab.city}
                                    </p>
                                )}
                            </div>
                            {lab.isVerified && (
                                <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                    Verified
                                </span>
                            )}
                        </div>

                        {lab.about && <p className="text-sm text-gray-600">{lab.about}</p>}

                        {lab.equipment.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Εξοπλισμός
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {lab.equipment.map((item) => (
                                        <span
                                            key={item}
                                            className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {lab.materials.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Υλικά
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {lab.materials.map((item) => (
                                        <span
                                            key={item}
                                            className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button variant="outline" size="sm" asChild>
                            <Link href="/lab/new">
                                <Package className="h-4 w-4 mr-1" /> Δημιούργησε εργασία
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <section className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Portfolio εργασιών</h2>
                    <PortfolioGallery
                        items={portfolio}
                        emptyLabel="Το εργαστήριο δεν έχει δημοσιεύσει εικόνες ακόμα."
                    />
                </section>
            </div>
        </div>
    )
}
