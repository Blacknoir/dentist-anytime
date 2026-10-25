import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyConsentEvidence } from "@/app/actions/lab-compliance"
import { formatDateTime } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabVerifyEvidencePage({
    searchParams,
}: {
    searchParams: Promise<{ evidence?: string; signature?: string }>
}) {
    const params = await searchParams
    const result =
        params.evidence && params.signature
            ? await verifyConsentEvidence(params.evidence, params.signature)
            : null

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-2xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900">
                    ← Επιστροφή
                </Link>

                <Card className="mt-3">
                    <CardHeader>
                        <CardTitle className="text-xl">Επαλήθευση αποδεικτικού αποδοχής</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!result && (
                            <p className="text-sm text-gray-600">
                                Στείλε το Evidence ID και την υπογραφή αποδεικτικού για να επαληθευτεί η
                                αποδοχή έναντι των αρχείων της Dentora.
                            </p>
                        )}

                        {result && (
                            <>
                                <div
                                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                                        result.valid
                                            ? "border-green-200 bg-green-50 text-green-800"
                                            : "border-red-200 bg-red-50 text-red-800"
                                    }`}
                                >
                                    {result.valid ? (
                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    ) : (
                                        <XCircle className="h-5 w-5 shrink-0" />
                                    )}
                                    <div>
                                        <p className="font-bold">
                                            {result.valid
                                                ? "Η υπογραφή είναι έγκυρη"
                                                : "Η υπογραφή δεν ταιριάζει"}
                                        </p>
                                        {result.reason && <p className="text-sm">{result.reason}</p>}
                                    </div>
                                </div>

                                <div className="divide-y divide-gray-100 text-sm">
                                    {[
                                        ["Αποδεικτικό", result.evidenceId],
                                        ["Έγγραφο", result.documentKey],
                                        ["Έκδοση", result.documentVersion],
                                        ["Ημερομηνία & ώρα", formatDateTime(result.acceptedAt)],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex justify-between py-2">
                                            <span className="text-gray-500">{label}</span>
                                            <span className="font-mono text-gray-900">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <Button asChild variant="outline">
                            <Link href="/lab/legal/consents">Τα δικά μου αποδεικτικά</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
