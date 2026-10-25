import Link from "next/link"
import { ArrowLeft, BadgeCheck, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationForm } from "@/components/lab/compliance-forms"
import { getMyVerificationRequest } from "@/app/actions/lab-compliance"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; classes: string }> = {
    PENDING: { label: "Σε αναμονή ελέγχου", classes: "bg-amber-50 text-amber-700 border-amber-200" },
    APPROVED: { label: "Επαληθευμένο", classes: "bg-green-50 text-green-700 border-green-200" },
    REJECTED: { label: "Απόρριψη", classes: "bg-red-50 text-red-700 border-red-200" },
}

export default async function LabVerificationPage() {
    const request = await getMyVerificationRequest()
    const meta = request ? STATUS_META[request.status] : null

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Επαλήθευση επαγγέλματος</h1>
                <p className="text-gray-600 mt-1">
                    Οι επαληθευμένοι οδοντίατρες και CAD designers εμφανίζουν το σήμα «Verified» στο δημόσιο
                    προφίλ τους, δίνοντας εμπιστοσύνη στους πελάτες τους.
                </p>

                {request && meta && (
                    <Card className="mt-6">
                        <CardContent className="p-5 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-gray-900">Η αίτησή σου</span>
                                <span
                                    className={`text-[11px] font-bold border rounded-full px-2.5 py-1 ${meta.classes}`}
                                >
                                    {meta.label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Υποβλήθηκε {formatDateTime(request.createdAt)}
                            </p>
                            {request.reviewNotes && (
                                <p className="text-sm text-gray-600">Σχόλια ελέγχου: {request.reviewNotes}</p>
                            )}
                            {request.status === "APPROVED" && (
                                <p className="text-sm text-green-700 flex items-center gap-1.5">
                                    <BadgeCheck className="h-4 w-4" /> Ο λογαριασμός σου είναι επαληθευμένος.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="mt-6">
                    <VerificationForm />
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Τι ελέγχεται</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                        <p>
                            • Οδοντίατρες: άδεια άσκησης, ΑΦΜ/επιχειρηματικό μητρώο, ταυτοποίηση στοιχείων.
                            <br />• CAD designers: επαγγελματική εμπειρία, portfolio, δείγματα εργασιών και
                            ταυτοποίηση στοιχείων.
                            <br />• Το αποτέλεσμα είναι δημόσιο σήμα επαλήθευσης — δεν δημοσιεύονται τα
                            έγγραφα.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
