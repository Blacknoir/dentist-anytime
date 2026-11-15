"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    AlertCircle,
    Check,
    CheckCircle2,
    FileUp,
    Loader2,
    MessageSquarePlus,
    PlayCircle,
    Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    acceptLabOffer,
    approveDelivery,
    cancelLabCase,
    releaseCasePayment,
    requestRevision,
    startProduction,
    submitLabDelivery,
    submitLabOffer,
} from "@/app/actions/lab"
import { ChunkedUploader } from "@/components/lab/chunked-uploader"
import { cn } from "@/lib/utils"
import { errorMessage } from "@/lib/error-message"

function useActionState() {
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const run = async (fn: () => Promise<unknown>, success?: string) => {
        setPending(true)
        setError(null)
        setMessage(null)
        try {
            await fn()
            if (success) setMessage(success)
            return true
        } catch (err: unknown) {
            setError(errorMessage(err))
            return false
        } finally {
            setPending(false)
        }
    }

    return { pending, error, message, run, setError }
}

/* ------------------------------------------------------------------ offers */

export function OfferForm({ caseId, priceHint, units }: { caseId: string; priceHint?: number | null; units: number }) {
    const [pending, startTransition] = useTransition()
    const [notice, setNotice] = useState<{ text: string; code?: string } | null>(null)
    const router = useRouter()
    const [price, setPrice] = useState(priceHint ? String(priceHint) : "")
    const [leadTime, setLeadTime] = useState("3")
    const [message, setMessage] = useState("")
    const submit = () => {
        setNotice(null)
        startTransition(async () => {
            try {
                const result = await submitLabOffer({
                    caseId,
                    price: Number(price),
                    leadTimeDays: Number(leadTime) || 3,
                    message,
                })
                if (!result.ok) {
                    setNotice({ text: result.message, code: result.code })
                    return
                }
                setNotice({ text: "Η προσφορά καταχωρίστηκε." })
                router.refresh()
            } catch {
                setNotice({ text: "Η προσφορά δεν μπόρεσε να καταχωριστεί. Δοκίμασε ξανά.", code: "UNAVAILABLE" })
            }
        })
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                    <span>Συνολική τιμή ({units} τεμ.) σε €</span>
                    <Input
                        placeholder="π.χ. 120"
                        inputMode="numeric"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </label>
                <label className="space-y-1 text-sm">
                    <span>Χρόνος παράδοσης σε ημέρες</span>
                    <Input
                        placeholder="π.χ. 3"
                        inputMode="numeric"
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
                    />
                </label>
            </div>
            <Textarea
                rows={3}
                placeholder="Μήνυμα προς τον πελάτη (π.χ. τι περιλαμβάνει η τιμή, χρόνος, υλικά)…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-[11px] text-gray-500">
                Μην γράψετε όνομα, email ή τηλέφωνο — αφαιρούνται αυτόματα. Οι συμφωνίες γίνονται μόνο
                μέσω της πλατφόρμας.
            </p>
            <Button
                className="w-full"
                disabled={pending || !price}
                onClick={submit}
            >
                {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Στείλε προσφορά
            </Button>
            {notice?.code === "CONSENTS_MISSING" ? (
                <p role="alert" className="text-sm text-red-600">
                    Για να στείλεις προσφορά, χρειάζεται να{" "}
                    <Link href="/lab/legal/consent" className="font-medium underline">αποδεχτείς τα υποχρεωτικά έγγραφα του Lab</Link>.
                </p>
            ) : notice && (
                <p role={notice.code ? "alert" : "status"} className={notice.code ? "text-sm text-red-600" : "text-sm text-green-700"}>
                    {notice.text}
                </p>
            )}
        </div>
    )
}

export function AcceptOfferButton({ caseId, offerId, disabled }: { caseId: string; offerId: string; disabled?: boolean }) {
    const { pending, error, run } = useActionState()

    return (
        <div>
            <Button
                size="sm"
                disabled={pending || disabled}
                onClick={() => run(() => acceptLabOffer(caseId, offerId)).then((ok) => ok && window.location.reload())}
            >
                {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Αποδοχή προσφοράς
            </Button>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    )
}

/* --------------------------------------------------------------- revisions */

export function RevisionRequest({ caseId }: { caseId: string }) {
    const { pending, error, message, run } = useActionState()
    const [text, setText] = useState("")

    return (
        <div className="space-y-2">
            <Textarea
                rows={3}
                placeholder="Τι πρέπει να διορθωθεί; (π.χ. αλλαγή chamfer, διόρθωση απόχρωσης, επανατοποθέτηση οδοντικού κομμάτιος)"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <Button
                variant="outline"
                size="sm"
                disabled={pending || text.trim().length < 3}
                onClick={() =>
                    run(() => requestRevision(caseId, text)).then((ok) => {
                        if (ok) setText("")
                    })
                }
            >
                {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageSquarePlus className="h-4 w-4 mr-1" />}
                Ζητήστε διόρθωση
            </Button>
            {message && <p className="text-xs text-green-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    )
}

/* -------------------------------------------------------------- approvals */

export function ApproveDeliveryButton({ caseId }: { caseId: string }) {
    const { pending, error, message, run } = useActionState()
    const router = useRouter()

    return (
        <div className="space-y-2">
            <Button
                className="w-full"
                disabled={pending}
                onClick={() =>
                    run(() => approveDelivery(caseId)).then((ok) => {
                        if (ok) {
                            setTimeout(() => router.refresh(), 600)
                        }
                    })
                }
            >
                {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Εγκρίνω παράδοση & αποδέσμευση πληρωμής
            </Button>
            {message && <p className="text-xs text-green-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    )
}

export function CancelCaseButton({ caseId, retryRefund = false }: { caseId: string; retryRefund?: boolean }) {
    const { pending, error, run } = useActionState()

    return (
        <div>
            <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={pending}
                onClick={() => {
                    if (!retryRefund && !window.confirm("Ακύρωση της εργασίας; Αν έχει γίνει πληρωμή, επιστρέφεται.")) return
                    run(() => cancelLabCase(caseId)).then((ok) => ok && window.location.reload())
                }}
            >
                {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {retryRefund ? "Δοκίμασε ξανά την επιστροφή" : "Ακύρωση εργασίας"}
            </Button>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    )
}

/* ------------------------------------------------------------ deliverables */

export function PayoutRetryButton({ caseId }: { caseId: string }) {
    const { pending, error, run } = useActionState()
    const router = useRouter()
    return (
        <div className="space-y-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={() =>
                run(async () => {
                    const result = await releaseCasePayment(caseId)
                    if (result.error) throw new Error(result.error)
                }).then((ok) => { if (ok) router.refresh() })
            }>
                {pending ? "Αποδέσμευση…" : "Δοκίμασε ξανά την αποδέσμευση"}
            </Button>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </div>
    )
}

export function DeliverableUpload({ caseId, hasDrafts }: { caseId: string; hasDrafts: boolean }) {
    const [uploaded, setUploaded] = useState(0)
    const [blocked, setBlocked] = useState(false)
    const { pending, error, run } = useActionState()
    const router = useRouter()

    return (
        <div className="space-y-3">
            <ChunkedUploader
                caseId={caseId}
                kind="OUTPUT_STL"
                accept=".stl,.obj,.3mf,.zip,.step,.stp,.pdf"
                label="Ανέβασε ολοκληρωμένα αρχεία"
                disabled={pending}
                onBlockedChange={setBlocked}
                onCompleted={() => setUploaded((count) => count + 1)}
            />
            {(hasDrafts || uploaded > 0) && (
                <p className="text-xs text-gray-600">Τα αποθηκευμένα αρχεία θα σταλούν όταν υποβάλεις την παράδοση.</p>
            )}
            <Button disabled={pending || blocked || (!hasDrafts && !uploaded)} onClick={() =>
                run(async () => {
                    const result = await submitLabDelivery(caseId)
                    if (result.error) throw new Error(result.error)
                }).then((ok) => { if (ok) router.refresh() })
            }>
                {pending ? "Υποβολή…" : "Υποβολή παράδοσης"}
            </Button>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        </div>
    )
}

/** The customer can add more files (photos, x-rays) to a running work. */
export function CustomerFilesUpload({ caseId }: { caseId: string }) {
    const [uploaded, setUploaded] = useState(0)
    const router = useRouter()

    return (
        <div className="space-y-3">
            <ChunkedUploader
                caseId={caseId}
                kind="PHOTO"
                accept=".jpg,.jpeg,.png,.dcm,.pdf,.txt,.doc,.docx,.stl"
                label="Πρόσθετα αρχεία"
                onCompleted={() => {
                    setUploaded((count) => count + 1)
                    router.refresh()
                }}
            />
            {uploaded > 0 && (
                <p className="text-xs text-green-700">Το αρχείο προστέθηκε στην εργασία.</p>
            )}
        </div>
    )
}

export function StartProductionButton({ caseId }: { caseId: string }) {
    const { pending, error, run } = useActionState()

    return (
        <div>
            <Button
                className="w-full"
                disabled={pending}
                onClick={() => run(() => startProduction(caseId)).then((ok) => ok && window.location.reload())}
            >
                {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                Ξεκίνα την παραγωγή
            </Button>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    )
}

/* -------------------------------------------------------------- utilities */

export function InlineNotice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "success" }) {
    const tones = {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warn: "bg-amber-50 border-amber-200 text-amber-800",
        success: "bg-green-50 border-green-200 text-green-800",
    }
    return (
        <div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-xs", tones[tone])}>
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{children}</span>
        </div>
    )
}

export function FileHint() {
    return (
        <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <FileUp className="h-3.5 w-3.5" /> Οι πελάτες βλέπουν τα αρχεία σου μόνο όταν τους έχεις αναθέσει την εργασία.
        </p>
    )
}
