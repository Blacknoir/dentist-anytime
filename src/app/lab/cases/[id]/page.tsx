import Link from "next/link"
import { notFound } from "next/navigation"
import {
    ArrowLeft,
    CalendarClock,
    CheckCircle2,
    Clock,
    FileUp,
    History,
    MessageSquare,
    Package,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLabActor, getLabCaseById } from "@/app/actions/lab"
import { FileRow, PaymentBadge, StatusBadge, Stars } from "@/components/lab/lab-components"
import {
    AcceptOfferButton,
    ApproveDeliveryButton,
    CancelCaseButton,
    DeliverableUpload,
    FileHint,
    InlineNotice,
    OfferForm,
    RevisionRequest,
    StartProductionButton,
} from "@/components/lab/case-panel"
import { CasePaymentPanel } from "@/components/lab/case-payment"
import { euros, formatDate, formatDateTime, LAB_PLATFORM_FEE_RATE, partyLabel } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const actor = await getLabActor()
    const target = await getLabCaseById(id)

    if (!target) notFound()

    const isOwner = actor?.userId === target.customerId
    const isAssigned = !!actor?.designerProfileId && target.assignedDesignerId === actor.designerProfileId
    const isAdmin = actor?.isAdmin
    const myOffer = target.offers.find((offer) => offer.designerProfileId === actor?.designerProfileId)

    // Files are private until the work is assigned.
    const visibleFiles = isOwner || isAssigned || isAdmin ? target.files : []
    // The owner sees every offer, a designer only their own.
    const visibleOffers = isOwner || isAdmin ? target.offers : myOffer ? [myOffer] : []
    // Counterparties only see an anonymous code — never a real name.
    const customerLabel = isAdmin
        ? target.customer.name || "Εμπισκευμένος"
        : isOwner
          ? actor?.name || "Εγώ"
          : partyLabel(target.customer)

    const canOffer =
        !!actor?.isDesigner && !isOwner && ["OPEN", "QUOTED"].includes(target.status) && !isAssigned
    const canPay = (isOwner || isAdmin) && target.status === "ASSIGNED" && target.paymentStatus === "UNPAID"
    const canApprove = (isOwner || isAdmin) && target.status === "DELIVERED"
    const canRequestRevision = (isOwner || isAdmin) && ["DELIVERED", "IN_PRODUCTION"].includes(target.status)
    const canDeliver = isAssigned && ["ASSIGNED", "IN_PRODUCTION"].includes(target.status)

    const designerServiceHint = actor?.designerProfileId
        ? target.assignedDesigner?.services?.[0]?.price ?? null
        : null

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <Link href="/lab/cases" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω στο board
                </Link>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {target.code} · {target.title}
                    </h1>
                    <StatusBadge status={target.status} />
                    <PaymentBadge status={target.paymentStatus} />
                    {target.priority === "EXPRESS" && (
                        <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1">
                            EXPRESS
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>{customerLabel}</span>
                    <span>Δημιουργήθηκε {formatDate(target.createdAt)}</span>
                    {target.deadline && (
                        <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" /> Παράδοση {formatDate(target.deadline)}
                        </span>
                    )}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Στοιχεία περιστατικού</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        ["Είδος", target.type],
                                        ["Υλικό", target.material],
                                        ["Απόχρωση", target.shade || "—"],
                                        ["Τεμάχια", String(target.units)],
                                    ].map(([label, value]) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-3">
                                            <div className="text-[11px] uppercase font-bold text-gray-400">{label}</div>
                                            <div className="font-bold text-gray-900">{value}</div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-gray-600 whitespace-pre-line">{target.description}</p>

                                {target.assignedDesigner && (
                                    <div className="flex items-center justify-between gap-3 bg-violet-50/60 border border-violet-100 rounded-xl px-3 py-2">
                                        <span className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-violet-600" />
                                            <span className="text-gray-600">Ανατέθηκε στον</span>
                                            <strong className="text-gray-900">
                                                CAD Designer
                                            </strong>
                                        </span>
                                        <Link
                                            href={`/lab/designers/${target.assignedDesigner.id}`}
                                            className="text-xs font-bold text-violet-700"
                                        >
                                            Προφίλ →
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Files */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileUp className="h-4 w-4" /> Αρχεία ({visibleFiles.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {visibleFiles.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        {isOwner || isAssigned
                                            ? "Δεν έχουν ανεβαστεί αρχεία σε αυτή την εργασία."
                                            : "Τα αρχεία της εργασίας είναι ιδιωτικά μέχρι να σου ανατεθεί."}
                                    </p>
                                ) : (
                                    visibleFiles.map((file) => <FileRow key={file.id} file={file} />)
                                )}
                                <FileHint />
                            </CardContent>
                        </Card>

                        {/* Offers */}
                        {(isOwner || isAdmin || myOffer) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Προσφορές ({visibleOffers.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {visibleOffers.length === 0 && (
                                        <p className="text-sm text-gray-500">
                                            Δεν έχει λάβει ακόμα προσφορές. Μπορείς να επιλέξεις designer από το
                                            προφίλ του ή να περιμένεις.
                                        </p>
                                    )}
                                    {visibleOffers.map((offer) => {
                                        const designer = offer.designerProfile
                                        const isMine = offer.designerProfileId === actor?.designerProfileId
                                        return (
                                            <div
                                                key={offer.id}
                                                className="border border-gray-200 rounded-2xl p-4"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <strong className="text-gray-900">
                                                                CAD Designer
                                                            </strong>
                                                            {designer.isVerified && (
                                                                <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                                                    Verified
                                                                </span>
                                                            )}
                                                            {offer.status === "ACCEPTED" && (
                                                                <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                                                                    Επιλεγμένος
                                                                </span>
                                                            )}
                                                            {isMine && (
                                                                <span className="text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5">
                                                                    Η προσφορά σου
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            {designer.reviewCount > 0 && (
                                                                <Stars rating={designer.rating} count={designer.reviewCount} />
                                                            )}
                                                            <span className="inline-flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" /> {offer.leadTimeDays} ημ.
                                                            </span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <Package className="h-3.5 w-3.5" /> {designer.completedCases}{" "}
                                                                εργασίες
                                                            </span>
                                                        </div>
                                                        {offer.message && (
                                                            <p className="text-sm text-gray-600 mt-2">“{offer.message}”</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-gray-900">{euros(offer.price)}</div>
                                                        {isOwner &&
                                                            target.status !== "COMPLETED" &&
                                                            target.status !== "CANCELLED" &&
                                                            offer.status === "PENDING" && (
                                                                <div className="mt-2">
                                                                    <AcceptOfferButton caseId={target.id} offerId={offer.id} />
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </Card>
                        )}

                        {/* Revisions */}
                        {target.revisions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <RefreshCcw className="h-4 w-4" /> Διορθώσεις ({target.revisions.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {target.revisions.map((revision) => (
                                        <div key={revision.id} className="border border-gray-200 rounded-2xl p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-xs font-bold uppercase text-gray-400">
                                                    {revision.status === "REQUESTED"
                                                        ? "Ζητήθηκε"
                                                        : revision.status === "DELIVERED"
                                                          ? "Στάλθηκε"
                                                          : "Λύθηκε"}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDateTime(revision.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2">{revision.message}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <History className="h-4 w-4" /> Ιστορικό
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="relative border-l border-gray-200 ml-2 space-y-4 text-sm">
                                    {[
                                        ["Δημιουργία εργασίας", formatDate(target.createdAt), true],
                                        [
                                            "Λήψη προσφορών",
                                            target.offers.length > 0 ? `${target.offers.length} προσφορές` : "σε αναμονή",
                                            target.offers.length > 0,
                                        ],
                                        [
                                            "Ανάθεση σε designer",
                                            target.assignedDesigner
                                                ? "CAD Designer"
                                                : "εκκρεμεί",
                                            !!target.assignedDesigner,
                                        ],
                                        [
                                            "Πληρωμή (escrow)",
                                            target.paymentStatus === "HELD"
                                                ? "κρατήθηκε"
                                                : target.paymentStatus === "RELEASED"
                                                  ? "αποδεσμεύτηκε"
                                                  : "εκκρεμεί",
                                            ["HELD", "RELEASED"].includes(target.paymentStatus),
                                        ],
                                        [
                                            "Παράδοση αρχείων",
                                            target.status === "DELIVERED" || target.status === "COMPLETED"
                                                ? "ολοκληρώθηκε"
                                                : "εκκρεμεί",
                                            ["DELIVERED", "COMPLETED"].includes(target.status),
                                        ],
                                        [
                                            "Έγκριση & ολοκλήρωση",
                                            target.status === "COMPLETED" ? "ολοκληρώθηκε" : "εκκρεμεί",
                                            target.status === "COMPLETED",
                                        ],
                                    ].map(([title, detail, done]) => (
                                        <li key={title as string} className="ml-4">
                                            <span
                                                className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2 ${
                                                    done ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                                                }`}
                                            />
                                            <div className="font-bold text-gray-900">{title}</div>
                                            <div className="text-gray-500 text-xs">{detail as string}</div>
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6">
                        {/* Payment */}
                        <Card className="border-primary-100">
                            <CardHeader>
                                <CardTitle className="text-base">Πληρωμή</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {target.agreedPrice ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Σύνολο εργασίας</span>
                                            <strong>{euros(target.agreedPrice)}</strong>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Προμήθεια Dentora ({LAB_PLATFORM_FEE_RATE}%)</span>
                                            <strong>{euros(target.platformFee ?? 0)}</strong>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed border-gray-200 pt-2">
                                            <span className="text-gray-500">Πληρωμή στον designer</span>
                                            <strong>{euros(target.designerPayout ?? 0)}</strong>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500">
                                        Δεν έχει επιλεγεί ακόμα designer, οπότε δεν υπάρχει τιμή.
                                    </p>
                                )}

                                {canPay && target.agreedPrice && (
                                    <div className="pt-2">
                                        <CasePaymentPanel
                                            caseId={target.id}
                                            amountCents={Math.round(target.agreedPrice * 100)}
                                            feeCents={Math.round((target.platformFee ?? 0) * 100)}
                                            payoutCents={Math.round((target.designerPayout ?? 0) * 100)}
                                            paymentStatus={target.paymentStatus}
                                        />
                                    </div>
                                )}

                                {target.paymentStatus === "HELD" && (
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Το ποσό κρατίεται σε ασφάλεια στη Dentora. Θα αποδεσμευτεί στον designer
                                        μόλις εγκρίνεις την παράδοση.
                                    </p>
                                )}

                                {target.status === "COMPLETED" && target.paymentStatus === "HELD" && (
                                    <p className="text-[11px] text-amber-600 leading-relaxed">
                                        Η εργασία ολοκληρώθηκε. Τα χρήματα θα αποδεσμευτούν στον designer μόλις
                                        συνδέσει το Stripe account του.
                                    </p>
                                )}

                                {target.paymentStatus === "HELD" && (
                                    <InlineNotice tone="warn">
                                        Το ποσό κρατείται σε ασφάλεια στη Dentora. Θα αποδεσμευτεί στον designer μόλις
                                        εγκρίνεις την παράδοση.
                                    </InlineNotice>
                                )}
                                {target.paymentStatus === "RELEASED" && (
                                    <InlineNotice tone="success">
                                        Η πληρωμή μεταφέρθηκε στον designer.
                                    </InlineNotice>
                                )}
                            </CardContent>
                        </Card>

                        {/* Owner actions */}
                        {(isOwner || isAdmin) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Ενέργειες πελάτη</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {canApprove && (
                                        <>
                                            <InlineNotice tone="success">
                                                Ο designer παρέδωσε τα αρχεία. Έγκρινέ τα για να αποδεσμευτεί η πληρωμή.
                                            </InlineNotice>
                                            <ApproveDeliveryButton caseId={target.id} />
                                        </>
                                    )}

                                    {canRequestRevision && target.status === "DELIVERED" && (
                                        <RevisionRequest caseId={target.id} />
                                    )}

                                    {target.status === "OPEN" && (
                                        <p className="text-sm text-gray-500">
                                            Περιμένεις προσφορές. Μπορείς να επιλέξεις και συγκεκριμένο designer από τη
                                            σελίδα του προφίλ του.
                                        </p>
                                    )}

                                    {target.status === "ASSIGNED" && target.paymentStatus === "UNPAID" && (
                                        <p className="text-sm text-gray-500">
                                            Ολοκλήρωσε την πληρωμή για να ξεκινήσει η παραγωγή.
                                        </p>
                                    )}

                                    {target.status === "IN_PRODUCTION" && (
                                        <p className="text-sm text-gray-500">Ο designer εργάζεται στην εργασία σου.</p>
                                    )}

                                    {target.status === "COMPLETED" && (
                                        <InlineNotice tone="success">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Η εργασία ολοκληρώθηκε.
                                        </InlineNotice>
                                    )}

                                    {["OPEN", "QUOTED", "ASSIGNED", "IN_PRODUCTION"].includes(target.status) && (
                                        <CancelCaseButton caseId={target.id} />
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Designer actions */}
                        {actor?.isDesigner && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Ενέργειες designer</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isAssigned ? (
                                        <>
                                            {canDeliver && <StartProductionButton caseId={target.id} />}
                                            {canDeliver && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Ανέβασε τα ολοκληρωμένα αρχεία
                                                    </p>
                                                    <DeliverableUpload caseId={target.id} />
                                                </div>
                                            )}
                                            {target.status === "DELIVERED" && (
                                                <InlineNotice tone="info">
                                                    Τα αρχεία σου στάλθηκαν στον πελάτη. Περιμένε έγκριση.
                                                </InlineNotice>
                                            )}
                                            {target.status === "COMPLETED" && (
                                                <InlineNotice tone="success">
                                                    Η εργασία ολοκληρώθηκε και η πληρωμή σου αποδεσμεύτηκε.
                                                </InlineNotice>
                                            )}
                                        </>
                                    ) : canOffer ? (
                                        <>
                                            <p className="text-sm text-gray-600">
                                                Στείλε τιμή και χρόνο παράδοσης. Ο πελάτης θα επιλέξει ανάμεσα στις
                                                προσφορές.
                                            </p>
                                            <OfferForm
                                                caseId={target.id}
                                                priceHint={designerServiceHint}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500">
                                            {myOffer
                                                ? "Έχεις στείλει προσφορά σε αυτή την εργασία."
                                                : "Δεν μπορείς να κάνεις προσφορά σε αυτή την εργασία."}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Selected designer shortcut for owners */}
                        {isOwner && target.status === "OPEN" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Επιλογή designer</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-gray-600">
                                    <p>
                                        Θέλεις να αναθέσεις την εργασία σε συγκεκριμένο designer; Δημιούργησε νέα εργασία
                                        με preselected designer από το προφίλ του.
                                    </p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/lab/designers">Δες τους designers</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
                            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>
                                Τα αρχεία της εργασίας είναι ιδιωτικά. Ο designer βλέπει τη σάρωση μόνο αφού του
                                ανατεθεί η εργασία.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
