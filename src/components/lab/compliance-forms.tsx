"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, ShieldAlert, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    reportSecurityIncident,
    requestDataDeletion,
    submitVerificationRequest,
} from "@/app/actions/lab-compliance"

export function VerificationForm() {
    const router = useRouter()
    const [notes, setNotes] = useState("")
    const [documentName, setDocumentName] = useState("")
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const submit = async () => {
        setPending(true)
        setError(null)
        try {
            await submitVerificationRequest({ notes, documentName })
            setDone(true)
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η αίτηση απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Αίτηση επαλήθευσης επαγγέλματος</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                    Αποστέλλεις τα στοιχεία επαλήθευσης (άδεια, ΑΦΜ/επιχειρηματικό μητρώο, portfolio) στο
                    συμμόρφωση της πλατφόρμας. Η έγκριση εμφανίζεται ως σήμα «Verified» στο δημόσιο προφίλ
                    σου.
                </p>
                <div className="space-y-1.5">
                    <Label htmlFor="v-doc">Αρχείο/παραστατικό επαλήθευσης</Label>
                    <Input
                        id="v-doc"
                        placeholder="π.χ. Άδεια άσκησης Οδοντίατρού — ΑΜ 12345"
                        value={documentName}
                        onChange={(event) => setDocumentName(event.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="v-notes">Σχόλια</Label>
                    <Textarea
                        id="v-notes"
                        rows={4}
                        placeholder="Εμπειρία, ειδικεύσεις, λογισμικά, συνεργασίες…"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                    />
                </div>
                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {done && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        Η αίτησή σου υποβλήθηκε. Θα ενημερωθείς μόλις ολοκληρωθεί ο έλεγχος.
                    </div>
                )}
                <Button onClick={submit} disabled={pending}>
                    {pending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4 mr-2" />
                    )}
                    Υποβολή αίτησης
                </Button>
            </CardContent>
        </Card>
    )
}

export function SecurityReportForm() {
    const router = useRouter()
    const [form, setForm] = useState({ title: "", severity: "MEDIUM", description: "", affectedData: "" })
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reference, setReference] = useState<string | null>(null)

    const submit = async () => {
        setPending(true)
        setError(null)
        try {
            const result = await reportSecurityIncident(form)
            setReference(result.reference)
            setForm({ title: "", severity: "MEDIUM", description: "", affectedData: "" })
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η αναφορά απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Αναφορά περιστατικού ασφαλείας
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="s-title">Σύντομη περιγραφή</Label>
                    <Input
                        id="s-title"
                        placeholder="π.χ. Μη εξουσιοδοτημένη πρόσβαση σε αρχείο εργασίας"
                        value={form.title}
                        onChange={(event) => setForm({ ...form, title: event.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="s-severity">Σοβαρότητα</Label>
                    <select
                        id="s-severity"
                        value={form.severity}
                        onChange={(event) => setForm({ ...form, severity: event.target.value })}
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        <option value="LOW">Χαμηλή</option>
                        <option value="MEDIUM">Μεσαία</option>
                        <option value="HIGH">Υψηλή</option>
                        <option value="CRITICAL">Κρίσιμη</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="s-desc">Αναλυτική περιγραφή</Label>
                    <Textarea
                        id="s-desc"
                        rows={5}
                        placeholder="Τι συνέβη, πότε, πώς το διαπίστωσες, ποια αρχεία/εργασίες εμπλέκονται."
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="s-data">Επηρεαζόμενα δεδομένα (προαιρετικό)</Label>
                    <Input
                        id="s-data"
                        placeholder="π.χ. αρχεία εργασίας στη θεραγίας X"
                        value={form.affectedData}
                        onChange={(event) => setForm({ ...form, affectedData: event.target.value })}
                    />
                </div>
                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {reference && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        Η αναφορά καταχωρήθηκε με αναφορά{" "}
                        <strong className="font-mono">{reference}</strong>. Θα επικοινωνήσουμε μαζί σου.
                    </div>
                )}
                <Button onClick={submit} disabled={pending}>
                    {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Υποβολή αναφοράς
                </Button>
            </CardContent>
        </Card>
    )
}

export function DeletionRequestForm() {
    const router = useRouter()
    const [scope, setScope] = useState("LAB_DATA")
    const [reason, setReason] = useState("")
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const submit = async () => {
        setPending(true)
        setError(null)
        try {
            await requestDataDeletion({ scope, reason })
            setDone(true)
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Το αίτημα απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Trash2 className="h-4 w-4" /> Αίτημα διαγραφής δεδομένων
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="d-scope">Εύρος διαγραφής</Label>
                    <select
                        id="d-scope"
                        value={scope}
                        onChange={(event) => setScope(event.target.value)}
                        className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                        <option value="LAB_DATA">Δεδομένα Dentora Lab (εργασίες, αρχεία, προσφορές)</option>
                        <option value="ALL">Όλα τα δεδομένα του λογαριασμού στη Dentora</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="d-reason">Αιτία (προαιρετικό)</Label>
                    <Textarea
                        id="d-reason"
                        rows={3}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="π.χ. Διακοπή συνεργασίας με την πλατφόρμα."
                    />
                </div>
                <p className="text-xs text-gray-500">
                    Τα αρχεία διαγράφονται οριστικά από τα αποθηκευμένα δεδομένα. Τα backups διαγράφονται
                    αυτόματα στον κύκλο ζωής τους (30 ημέρες). Οι αποδείξεις συγκατάθεσης και οι εγγραφές
                    ελέγχου διατηρούνται 5 έτη για νομική συμμόρφωση.
                </p>
                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
                {done && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        Το αίτημα καταχωρήθηκε. Θα ολοκληρωθεί εντός 30 ημερών.
                    </div>
                )}
                <Button variant="outline" onClick={submit} disabled={pending}>
                    {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Υποβολή αιτήματος διαγραφής
                </Button>
            </CardContent>
        </Card>
    )
}
