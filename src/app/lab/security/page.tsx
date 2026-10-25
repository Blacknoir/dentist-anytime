import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityReportForm } from "@/components/lab/compliance-forms"
import { listSecurityIncidents } from "@/app/actions/lab-compliance"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
    REPORTED: "Αναφέρθηκε",
    TRIAGED: "Αξιολογήθηκε",
    INVESTIGATING: "Σε έρευνα",
    RESOLVED: "Επιλύθηκε",
    DISCLOSED: "Γνωστοποιήθηκε",
}

const SEVERITY_LABELS: Record<string, string> = {
    LOW: "Χαμηλή",
    MEDIUM: "Μεσαία",
    HIGH: "Υψηλή",
    CRITICAL: "Κρίσιμη",
}

export default async function LabSecurityPage() {
    const incidents = await listSecurityIncidents()

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Ασφάλεια & περιστατικά</h1>
                <p className="text-gray-600 mt-1">
                    Αναφέρετε κάθε ύποπτη δραστηριότητα ή επίπεδο διαρροής. Κάθε αναφορά λαμβάνει
                    αναφορά περιστατικού, αξιολογείται και, εφόσον απαιτείται, γνωστοποιείται στους
                    επηρεαζόμενους χρήστες.
                </p>

                <div className="mt-6">
                    <SecurityReportForm />
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" /> Δημόσιο αρχείο περιστατικών
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {incidents.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Δεν έχει καταγραφεί δημόσιο περιστατικό ασφαλείας.
                            </p>
                        )}
                        {incidents.map((incident) => (
                            <div key={incident.id} className="border border-gray-200 rounded-2xl p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-xs text-gray-500">{incident.reference}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                                            {SEVERITY_LABELS[incident.severity] || incident.severity}
                                        </span>
                                        <span className="text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5">
                                            {STATUS_LABELS[incident.status] || incident.status}
                                        </span>
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 mt-2">{incident.title}</h3>
                                {incident.publicSummary && (
                                    <p className="text-sm text-gray-600 mt-1">{incident.publicSummary}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2">
                                    Αναφέρθηκε {formatDateTime(incident.reportedAt)}
                                    {incident.resolvedAt && ` · Επιλύθηκε ${formatDateTime(incident.resolvedAt)}`}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
