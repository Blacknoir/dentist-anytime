import Link from "next/link"
import { redirect } from "next/navigation"
import {
    Banknote,
    CalendarClock,
    CheckCircle2,
    Clock,
    CreditCard,
    Inbox,
    Package,
    Settings,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLabActor } from "@/app/actions/lab"
import { getDesignerDashboard, getDesignerStripeStatus } from "@/app/actions/lab-designer"
import { FileRow, PaymentBadge, StatusBadge } from "@/components/lab/lab-components"
import { DeliverableUpload, InlineNotice, OfferForm, StartProductionButton } from "@/components/lab/case-panel"
import { euros, formatDate } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function DesignerDashboardPage() {
    const actor = await getLabActor()
    if (!actor?.isDesigner) redirect("/lab/register")

    const [dashboard, stripeStatus] = await Promise.all([getDesignerDashboard(), getDesignerStripeStatus()])
    if (!dashboard) redirect("/lab/register")

    const { assignedCases, offers, openCases, profile } = dashboard
    const pendingOffers = offers.filter((offer) => offer.status === "PENDING")

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Οι εργασίες μου</h1>
                        <p className="text-gray-600 mt-1">
                            Προσφορές, ανατεθειμένες εργασίες και παραδοτέα.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/lab/designer/profile">
                                <Settings className="h-4 w-4 mr-1" /> Το προφίλ μου
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/lab/cases?scope=open">Δες ανοιχτές εργασίες</Link>
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Ανατεθειμένες εργασίες", value: String(assignedCases.length) },
                        { label: "Εκκρεμείς προσφορές", value: String(pendingOffers.length) },
                        { label: "Ολοκληρωμένες εργασίες", value: String(profile?.completedCases ?? 0) },
                        { label: "Τα εισόδημα μου", value: euros(profile?.earnings ?? 0) },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Stripe */}
                <div className="mt-6">
                    {stripeStatus.isConnected ? (
                        <InlineNotice tone="success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Το Stripe είναι συνδεδεμένο — μπορείς να
                            λαμβάνεις πληρωμές.
                        </InlineNotice>
                    ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3">
                            <span className="flex items-start gap-2">
                                <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                                Σύνδεσε το Stripe για να λαμβάνεις τις πληρωμές των εργασιών σου.
                            </span>
                            <Button size="sm" variant="outline" asChild>
                                <Link href="/lab/designer?stripe=connect">Σύνδεση Stripe</Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Assigned cases */}
                <section className="mt-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5" /> Ανατεθειμένες εργασίες
                    </h2>

                    {assignedCases.length === 0 ? (
                        <Card className="mt-4">
                            <CardContent className="p-8 text-center text-gray-600">
                                Δεν σου έχει ανατεθεί εργασία ακόμα. Ρίξε μια ματιά στις ανοιχτές εργασίες.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="mt-4 space-y-4">
                            {assignedCases.map((target) => (
                                <Card key={target.id}>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={`/lab/cases/${target.id}`}
                                                        className="font-bold text-gray-900 hover:text-primary-600"
                                                    >
                                                        {target.code} · {target.title}
                                                    </Link>
                                                    <StatusBadge status={target.status} />
                                                    <PaymentBadge status={target.paymentStatus} />
                                                    {target.priority === "EXPRESS" && (
                                                        <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                                            EXPRESS
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {target.type} · {target.material} · {target.units} τεμ.
                                                    {target.deadline && (
                                                        <span className="inline-flex items-center gap-1 ml-3">
                                                            <CalendarClock className="h-3.5 w-3.5" />{" "}
                                                            {formatDate(target.deadline)}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            {target.agreedPrice && (
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-gray-900">
                                                        {euros(target.agreedPrice)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        καθαρά {euros(target.designerPayout ?? 0)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-600">{target.description}</p>

                                        {target.files.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold uppercase text-gray-400">
                                                    Αρχεία πελάτη
                                                </div>
                                                {target.files.map((file) => (
                                                    <FileRow key={file.id} file={file} />
                                                ))}
                                            </div>
                                        )}

                                        {target.revisions.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold uppercase text-gray-400">
                                                    Αιτήματα διόρθωσης
                                                </div>
                                                {target.revisions.map((revision) => (
                                                    <div
                                                        key={revision.id}
                                                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                                                    >
                                                        {revision.message}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {["ASSIGNED", "IN_PRODUCTION"].includes(target.status) && (
                                            <div className="flex flex-wrap items-end gap-3">
                                                {target.status === "ASSIGNED" && (
                                                    <div className="w-full sm:w-64">
                                                        <StartProductionButton caseId={target.id} />
                                                    </div>
                                                )}
                                                <div className="w-full sm:w-80">
                                                    <DeliverableUpload caseId={target.id} />
                                                </div>
                                            </div>
                                        )}

                                        {target.status === "DELIVERED" && (
                                            <InlineNotice tone="info">
                                                Τα αρχεία σου στάλθηκαν στον πελάτη. Περιμένετε έγκριση για την
                                                αποδέσμευση της πληρωμής.
                                            </InlineNotice>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* My offers */}
                <section className="mt-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Inbox className="h-5 w-5" /> Οι προσφορές μου
                    </h2>

                    {offers.length === 0 ? (
                        <Card className="mt-4">
                            <CardContent className="p-8 text-center text-gray-600">
                                Δεν έχεις στείλει προσφορές ακόμα.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {offers.map((offer) => (
                                <Card key={offer.id}>
                                    <CardContent className="p-5 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Link
                                                href={`/lab/cases/${offer.case.id}`}
                                                className="font-bold text-gray-900 hover:text-primary-600"
                                            >
                                                {offer.case.code} · {offer.case.title}
                                            </Link>
                                            <span className="text-sm font-bold text-gray-900">
                                                {euros(offer.price)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="h-3.5 w-3.5" /> {offer.leadTimeDays} ημέρες
                                            <StatusBadge status={offer.case.status} />
                                            {offer.status === "ACCEPTED" && (
                                                <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                                                    Επιλέχθηκε
                                                </span>
                                            )}
                                            {offer.status === "REJECTED" && (
                                                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                                                    Απορρίφθηκε
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Open opportunities */}
                <section className="mt-10">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> Ανοιχτές εργασίες για προσφορά
                    </h2>

                    {openCases.length === 0 ? (
                        <Card className="mt-4">
                            <CardContent className="p-8 text-center text-gray-600">
                                Δεν υπάρχουν ανοιχτές εργασίες αυτή τη στιγμή.
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {openCases.map((openCase) => {
                                const existing = offers.find((offer) => offer.case.id === openCase.id)
                                return (
                                    <Card key={openCase.id}>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center justify-between gap-2">
                                                <Link
                                                    href={`/lab/cases/${openCase.id}`}
                                                    className="hover:text-primary-600"
                                                >
                                                    {openCase.code} · {openCase.title}
                                                </Link>
                                                {openCase.priority === "EXPRESS" && (
                                                    <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                                        EXPRESS
                                                    </span>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm text-gray-600 line-clamp-3">{openCase.title}</p>
                                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                                                <span className="bg-gray-100 rounded-full px-2 py-0.5">{openCase.type}</span>
                                                <span className="bg-gray-100 rounded-full px-2 py-0.5">{openCase.material}</span>
                                                <span className="bg-gray-100 rounded-full px-2 py-0.5">
                                                    {openCase.units} τεμ.
                                                </span>
                                                {openCase.deadline && (
                                                    <span className="bg-gray-100 rounded-full px-2 py-0.5">
                                                        {formatDate(openCase.deadline)}
                                                    </span>
                                                )}
                                            </div>
                                            {existing ? (
                                                <InlineNotice tone="info">
                                                    Έχεις ήδη στείλει προσφορά ({euros(existing.price)}).
                                                </InlineNotice>
                                            ) : (
                                                <OfferForm caseId={openCase.id} />
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </section>

                <div className="mt-10 flex items-start gap-2 text-[11px] text-gray-400">
                    <Banknote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                        Οι πληρωμές σου μεταφέρονται αυτόματα μέσω Stripe όταν ο πελάτης εγκρίνει την παράδοση.
                        Η πλατφόρμα κρατά προμήθεια 10%.
                    </span>
                </div>
            </div>
        </div>
    )
}
