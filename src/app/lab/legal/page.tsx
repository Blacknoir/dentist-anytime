import Link from "next/link"
import { FileText, KeyRound, Scale, ShieldCheck, Trash2, TriangleAlert, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    getLegalDocuments,
    getMissingConsents,
    getMyConsents,
    getTwoFactorStatus,
} from "@/app/actions/lab-compliance"
import { TwoFactorPanel } from "@/components/lab/two-factor-panel"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabLegalPage() {
    const [documents, consents, missing, twoFactor] = await Promise.all([
        getLegalDocuments(),
        getMyConsents(),
        getMissingConsents(),
        getTwoFactorStatus(),
    ])

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <h1 className="text-3xl font-bold text-gray-900">Έγγραφα, αποδοχές & συμμόρφωση</h1>
                <p className="text-gray-600 mt-1">
                    Νόμιμη βάση, αποδεικτικά αποδοχής, ασφάλεια δεδομένων και διαδικασίες διαγραφής για το
                    Dentora Lab.
                </p>

                {missing.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="font-bold text-gray-900">Εκκρεμούν αποδοχές</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Για να χρησιμοποιείς το Lab πρέπει να αποδεχτείς ξεχωριστά:{" "}
                                {missing.join(", ")}.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/lab/legal/consent">Αποδοχή εγγράφων</Link>
                        </Button>
                    </div>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                        {
                            icon: FileText,
                            title: "Υποχρεωτικά έγγραφα",
                            text: "Όροι χρήσης, σύμβαση επεξεργασίας δεδομένων, πολιτική απορρήτου & δήλωση νόμιμης βάσης.",
                            href: "/lab/legal/consent",
                            cta: "Αποδοχή εγγράφων",
                        },
                        {
                            icon: Scale,
                            title: "Αποδείξεις αποδοχής",
                            text: "Ιστορικό αποδοχών με έκδοση εγγράφου, ημερομηνία και εξαγωγή αποδεικτικού.",
                            href: "/lab/legal/consents",
                            cta: "Δες αποδείξεις",
                        },
                        {
                            icon: Users,
                            title: "Επαλήθευση επαγγέλματος",
                            text: "Επαλήθευση οδοντιάτρων και CAD designers με επισήμανση «Verified» στο προφίλ.",
                            href: "/lab/verification",
                            cta: "Αίτηση επαλήθευσης",
                        },
                        {
                            icon: ShieldCheck,
                            title: "Ασφάλεια & περιστατικά",
                            text: "Κρυπτογράφηση, καταγραφή πρόσβασης, 2FA και αναφορά περιστατικών ασφαλείας.",
                            href: "/lab/security",
                            cta: "Ασφάλεια",
                        },
                        {
                            icon: Trash2,
                            title: "Διατήρηση & διαγραφή",
                            text: "Πολιτική διατήρησης, backups και αίτημα διαγραφής των δεδομένων σου.",
                            href: "/lab/legal/retention",
                            cta: "Πολιτική διατήρησης",
                        },
                        {
                            icon: Scale,
                            title: "Υπεκτελούντες & συμβάσεις",
                            text: "Κατάλογος υπεκτελούντων (cloud providers) και σχετικές συμβάσεις επεξεργασίας.",
                            href: "/lab/legal/subprocessors",
                            cta: "Κατάλογος",
                        },
                    ].map((item) => {
                        const Icon = item.icon
                        return (
                            <Card key={item.title}>
                                <CardContent className="p-5 space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h2 className="font-bold text-gray-900">{item.title}</h2>
                                    <p className="text-sm text-gray-600">{item.text}</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={item.href}>{item.cta}</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TwoFactorPanel enabled={twoFactor.enabled} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <KeyRound className="h-4 w-4" /> Ιστορικό αποδοχών
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {consents.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    Δεν έχεις αποδεχτεί ακόμα κάποιο έγγραφο στο εργαλείο Dentora Lab.
                                </p>
                            ) : (
                                consents.slice(0, 6).map((consent) => (
                                    <div
                                        key={consent.id}
                                        className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm"
                                    >
                                        <span className="min-w-0">
                                            <span className="font-medium text-gray-800 block truncate">
                                                {consent.documentTitle}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                v{consent.documentVersion} · {formatDateTime(consent.acceptedAt)} ·{" "}
                                                {consent.evidenceId}
                                            </span>
                                        </span>
                                        {!consent.isCurrentVersion && (
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                                                Νέα έκδοση
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                            <Button variant="outline" size="sm" className="w-full" asChild>
                                <Link href="/lab/legal/consents">Όλα τα αποδεικτικά</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Έκδοση εγγράφων</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {documents.map((document) => (
                            <div
                                key={document.id}
                                className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm"
                            >
                                <span>
                                    <span className="font-medium text-gray-800 block">{document.title}</span>
                                    <span className="text-xs text-gray-400">
                                        έκδοση {document.version} · hash {document.contentHash.slice(0, 12)}…
                                    </span>
                                </span>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/lab/legal/documents/${document.key.toLowerCase()}`}>Διάβασμα</Link>
                                </Button>
                            </div>
                        ))}
                        <p className="flex items-start gap-2 text-[11px] text-gray-400 mt-2">
                            <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            Η έκδοση κάθε εγγράφου καταγράφεται στην αποδοχή. Μετά από αλλαγή έκδοσης, οι
                            χρήστες ενημερώνονται και οφείλουν να αποδεχτούν ξανά.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
