import Link from "next/link"
import { ArrowLeft, Download, FileCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyConsents } from "@/app/actions/lab-compliance"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabConsentsPage() {
    const consents = await getMyConsents()

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Αποδείξεις αποδοχής</h1>
                <p className="text-gray-600 mt-1">
                    Κάθε αποδοχή αποθηκεύεται με χρονική σήμανση, έκδοση εγγράφου, hash περιεχομένου και
                    υπογραφή. Μπορείς να εξάγεις αποδεικτικό σε JSON για αρχείο ή επαλήθευση.
                </p>

                <div className="mt-6 space-y-4">
                    {consents.length === 0 && (
                        <Card>
                            <CardContent className="p-8 text-center space-y-3">
                                <p className="text-gray-600">Δεν υπάρχουν καταγεγραμμένες αποδοχές.</p>
                                <Button asChild>
                                    <Link href="/lab/legal/consent">Αποδοχή εγγράφων</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {consents.map((consent) => (
                        <Card key={consent.id}>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                            <FileCheck2 className="h-4 w-4 text-green-600" />
                                            {consent.documentTitle}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Έκδοση {consent.documentVersion} · hash{" "}
                                            {consent.documentHash.slice(0, 16)}…
                                        </p>
                                    </div>
                                    {!consent.isCurrentVersion && (
                                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                            Υπάρχει νεότερη έκδοση
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                        <div className="text-[11px] uppercase font-bold text-gray-400">
                                            Ημερομηνία & ώρα
                                        </div>
                                        <div className="font-medium text-gray-800">
                                            {formatDateTime(consent.acceptedAt)}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                        <div className="text-[11px] uppercase font-bold text-gray-400">
                                            Αποδεικτικό
                                        </div>
                                        <div className="font-mono font-medium text-gray-800">
                                            {consent.evidenceId}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                        <div className="text-[11px] uppercase font-bold text-gray-400">
                                            Αναγνωριστικό χρήστη
                                        </div>
                                        <div className="font-mono text-xs text-gray-700 break-all">
                                            {consent.userId}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                        <div className="text-[11px] uppercase font-bold text-gray-400">
                                            IP address
                                        </div>
                                        <div className="font-mono text-xs text-gray-700 break-all">
                                            {consent.ipAddress || "—"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`/api/lab/consents/${consent.evidenceId}/certificate`} download>
                                            <Download className="h-4 w-4 mr-1" /> Εξαγωγή αποδεικτικού (JSON)
                                        </a>
                                    </Button>
                                    <Button variant="ghost" size="sm" asChild>
                                        <a
                                            href={`/api/lab/consents/${consent.evidenceId}/certificate?format=html`}
                                            target="_blank"
                                        >
                                            Εκτύπωση
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
