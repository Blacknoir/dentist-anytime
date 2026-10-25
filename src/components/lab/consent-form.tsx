"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { recordLabConsents } from "@/app/actions/lab-compliance"
import { LAB_LEGAL_DOCUMENTS, REQUIRED_LAB_CONSENTS } from "@/lib/lab-legal"

export function ConsentForm() {
    const router = useRouter()
    const [accepted, setAccepted] = useState<Record<string, boolean>>({
        TERMS: false,
        DPA: false,
        PRIVACY: false,
    })
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const allChecked = REQUIRED_LAB_CONSENTS.every((key) => accepted[key])

    const submit = async () => {
        setPending(true)
        setError(null)
        try {
            await recordLabConsents(accepted)
            setDone(true)
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η αποδοχή απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    if (done) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                    <div>
                        <h3 className="font-bold text-gray-900">Η αποδοχή καταχωρήθηκε</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Καταγράφηκε ο χρήστης, η ημερομηνία/ώρα, η έκδοση κάθε εγγράφου και ένα μοναδικό
                            αποδεικτικό αποδοχής. Μπορείς να το κατεβάσεις από τη σελίδα{" "}
                            <Link href="/lab/legal/consents" className="font-bold text-primary-700 underline">
                                αποδείξεις
                            </Link>
                            .
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Αποδοχή υποχρεωτικών εγγράφων</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Κάθε έγγραφο αποδέχεται ξεχωριστά. Καταγράφουμε τον χρήστη, την ημερομηνία και ώρα
                    αποδοχής, την έκδοση του εγγράφου και ένα μοναδικό αποδεικτικό (evidence id).
                </p>

                <div className="space-y-3">
                    {LAB_LEGAL_DOCUMENTS.map((document) => (
                        <label
                            key={document.key}
                            className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-primary-300"
                        >
                            <input
                                type="checkbox"
                                checked={accepted[document.key] ?? false}
                                onChange={(event) =>
                                    setAccepted((prev) => ({
                                        ...prev,
                                        [document.key]: event.target.checked,
                                    }))
                                }
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                            />
                            <span className="text-sm text-gray-700">
                                {document.acceptanceText}
                                <span className="flex items-center gap-1 mt-1.5 text-xs text-primary-700">
                                    <FileText className="h-3.5 w-3.5" />
                                    {document.title} · έκδοση {document.version}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <Button className="w-full" disabled={!allChecked || pending} onClick={submit}>
                    {pending ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Καταγραφή...
                        </>
                    ) : (
                        "Αποδοχή και καταγραφή"
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
