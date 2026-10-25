import Link from "next/link"
import { Search, PlusCircle, Briefcase, PackageOpen, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getLabActor, getLabCases } from "@/app/actions/lab"
import { CaseCard } from "@/components/lab/lab-components"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_FILTERS = [
    { value: "", label: "Όλες" },
    { value: "OPEN", label: "Ανοιχτές" },
    { value: "QUOTED", label: "Με προσφορές" },
    { value: "ASSIGNED", label: "Ανατέθηκε" },
    { value: "IN_PRODUCTION", label: "Σε εξέλιξη" },
    { value: "DELIVERED", label: "Παραδόθηκε" },
    { value: "COMPLETED", label: "Ολοκληρώθηκε" },
]

export default async function LabCasesPage({
    searchParams,
}: {
    searchParams: Promise<{ scope?: string; q?: string; status?: string }>
}) {
    const params = await searchParams
    const scope = (params.scope || "open") as "open" | "mine" | "assigned"
    const query = params.q || ""
    const status = params.status || ""

    const actor = await getLabActor()
    const cases = await getLabCases({ scope, query, status: status || undefined })

    const tabs = [
        { value: "open", label: "Ανοιχτές εργασίες", icon: PackageOpen, show: true },
        { value: "mine", label: "Οι εργασίες μου", icon: ClipboardList, show: !!actor },
        {
            value: "assigned",
            label: "Ανατεθειμένες σε εμένα",
            icon: Briefcase,
            show: actor?.isDesigner,
        },
    ].filter((tab) => tab.show)

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Εργασίες CAD</h1>
                        <p className="text-gray-600 mt-1">
                            Ανοιχτές εργασίες του δικτύου, οι δικές σου εργασίες και αυτές που σου έχουν ανατεθεί.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/lab/new">
                            <PlusCircle className="h-4 w-4 mr-1" /> Νέα εργασία
                        </Link>
                    </Button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const active = scope === tab.value
                        return (
                            <Link
                                key={tab.value}
                                href={`/lab/cases?scope=${tab.value}`}
                                className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors",
                                    active
                                        ? "bg-primary-600 text-white border-primary-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </Link>
                        )
                    })}
                </div>

                <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
                    <input type="hidden" name="scope" value={scope} />
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input name="q" defaultValue={query} placeholder="Αναζήτηση σε κωδικό, τύπο, υλικό…" className="pl-9" />
                    </div>
                    <select
                        name="status"
                        defaultValue={status}
                        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        {STATUS_FILTERS.map((filter) => (
                            <option key={filter.value} value={filter.value}>
                                {filter.label}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="outline">
                        Αναζήτηση
                    </Button>
                </form>

                <div className="mt-6">
                    {cases.length === 0 ? (
                        <Card>
                            <CardContent className="p-10 text-center space-y-3">
                                <p className="text-gray-600">
                                    {scope === "mine"
                                        ? "Δεν έχεις δημιουργήσει εργασίες ακόμα."
                                        : scope === "assigned"
                                          ? "Δεν σου έχει ανατεθεί εργασία ακόμα."
                                          : "Δεν βρέθηκαν εργασίες με αυτά τα κριτήρια."}
                                </p>
                                <Button asChild>
                                    <Link href="/lab/new">Δημιούργησε εργασία</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {cases.map((c) => (
                                <CaseCard key={c.id} c={c} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
