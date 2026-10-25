import Link from "next/link"
import { Building2, MapPin, Package, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function LabLabsPage() {
    const labs = await prisma.labProfile.findMany({
        orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
        include: { user: { select: { id: true, name: true } } },
    })

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Οδοντοτεχνικά εργαστήρια</h1>
                        <p className="text-gray-600 mt-1">
                            Εργαστήρια που δημιουργούν εργασίες CAD μέσω της πλατφόρμας.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/lab/register">
                            <PlusCircle className="h-4 w-4 mr-1" /> Εγγραφή εργαστηρίου
                        </Link>
                    </Button>
                </div>

                <div className="mt-8">
                    {labs.length === 0 ? (
                        <Card>
                            <CardContent className="p-10 text-center space-y-3">
                                <Building2 className="h-8 w-8 text-gray-300 mx-auto" />
                                <p className="text-gray-600">
                                    Δεν έχει εγγραφεί ακόμα οδοντοτεχνικό εργαστήριο. Γίνε το πρώτο!
                                </p>
                                <Button asChild>
                                    <Link href="/lab/register">Εγγραφή εργαστηρίου</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {labs.map((lab) => (
                                <Card key={lab.id} className="h-full">
                                    <CardContent className="p-5 space-y-3 h-full flex flex-col">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-900">{lab.labName}</h3>
                                            {lab.isVerified && (
                                                <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        {lab.city && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" /> {lab.city}
                                            </p>
                                        )}
                                        {lab.about && <p className="text-sm text-gray-600">{lab.about}</p>}
                                        {lab.materials.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {lab.materials.slice(0, 4).map((material) => (
                                                    <span
                                                        key={material}
                                                        className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                                                    >
                                                        {material}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-auto pt-2">
                                            <Button variant="outline" size="sm" className="w-full" asChild>
                                                <Link href="/lab/new">
                                                    <Package className="h-4 w-4 mr-1" /> Δημιούργησε εργασία
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
