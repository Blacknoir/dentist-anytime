import Link from "next/link"
import { Search, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { prisma } from "@/lib/prisma"
import { DesignerCard } from "@/components/lab/lab-components"

export const dynamic = "force-dynamic"

const SORTS = [
    { value: "rating", label: "Υψηλότερη βαθμολογία" },
    { value: "price", label: "Χαμηλότερη τιμή" },
    { value: "speed", label: "Γρηγορότερος" },
    { value: "jobs", label: "Περισσότερες εργασίες" },
]

export default async function LabDesignersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; service?: string; maxPrice?: string; sort?: string }>
}) {
    const params = await searchParams
    const query = params.q?.trim() || ""
    const service = params.service || ""
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : null
    const sort = params.sort || "rating"

    const where: Record<string, any> = {}

    if (query) {
        where.OR = [
            { user: { name: { contains: query, mode: "insensitive" } } },
            { headline: { contains: query, mode: "insensitive" } },
            { bio: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
        ]
    }
    if (service) {
        where.services = { some: { name: { contains: service, mode: "insensitive" }, isActive: true } }
    }
    if (maxPrice) {
        where.services = {
            ...(where.services || {}),
            some: {
                ...((where.services as any)?.some || {}),
                price: { lte: maxPrice },
                isActive: true,
            },
        }
    }

    const orderBy =
        sort === "price"
            ? { services: { _count: "asc" } }
            : sort === "speed"
              ? { avgLeadTimeDays: "asc" }
              : sort === "jobs"
                ? { completedCases: "desc" }
                : { rating: "desc" }

    const designers = await prisma.designerProfile.findMany({
        where,
        orderBy: [orderBy as any, { createdAt: "desc" }],
        include: {
            user: { select: { id: true, name: true, image: true } },
            services: { where: { isActive: true } },
        },
    })

    const serviceNames = await prisma.designerService.findMany({
        where: { isActive: true },
        distinct: ["name"],
        select: { name: true },
        orderBy: { name: "asc" },
    })

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                <h1 className="text-3xl font-bold text-gray-900">CAD designers</h1>
                <p className="text-gray-600 mt-1">
                    Ανεξάρτητοι σχεδιαστές με δικά τους προφίλ, υπηρεσίες και τιμές.
                </p>

                <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input name="q" defaultValue={query} placeholder="Όνομα, ειδικότητα, πόλη…" className="pl-9" />
                    </div>

                    <select
                        name="service"
                        defaultValue={service}
                        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        <option value="">Όλες οι υπηρεσίες</option>
                        {serviceNames.map((item) => (
                            <option key={item.name} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <Input
                        name="maxPrice"
                        type="number"
                        min={1}
                        defaultValue={params.maxPrice || ""}
                        placeholder="Έως (€)"
                        className="w-32"
                    />

                    <select
                        name="sort"
                        defaultValue={sort}
                        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        {SORTS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <Button type="submit" variant="outline">
                        <SlidersHorizontal className="h-4 w-4 mr-1" /> Φιλτράρισμα
                    </Button>
                </form>

                <div className="mt-8">
                    {designers.length === 0 ? (
                        <Card>
                            <CardContent className="p-10 text-center space-y-3">
                                <p className="text-gray-600">Δεν βρέθηκαν designers με αυτά τα κριτήρια.</p>
                                <Button variant="outline" asChild>
                                    <Link href="/lab/register">Εγγραφή CAD designer</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {designers.map((designer) => (
                                <DesignerCard key={designer.id} designer={designer} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
