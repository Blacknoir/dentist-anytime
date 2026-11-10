"use client"

import { useState } from "react"
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
    Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    acceptLabOffer,
    approveDelivery,
    cancelLabCase,
    requestRevision,
    startProduction,
    submitLabOffer,
    uploadDesignerFiles,
} from "@/app/actions/lab"
import { cn } from "@/lib/utils"

function useActionState() {
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)

    const run = async (fn: () => Promise<any>, success?: string) => {
        setPending(true)
        setError(null)
        setMessage(null)
        try {
            await fn()
            if (success) setMessage(success)
            return true
        } catch (err: any) {
            setError(err?.message || "Η ενέργεια απέτυχε.")
            return false
        } finally {
            setPending(false)
        }
    }

    return { pending, error, message, run, setError }
}

/* ------------------------------------------------------------------ offers */

export function OfferForm({ caseId, priceHint }: { caseId: string; priceHint?: number | null }) {
    const { pending, error, run } = useActionState()
    const [price, setPrice] = useState(priceHint ? String(priceHint) : "")
    const [leadTime, setLeadTime] = useState("3")
    const [message, setMessage] = useState("")

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <Input
                    placeholder="Τιμή (€)"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <Input
                    placeholder="Χρόνος παράδοσης (ημέρες)"
                    inputMode="numeric"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                />
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
                onClick={() =>
                    run(() =>
                        submitLabOffer({
                            caseId,
                            price: Number(price),
                            leadTimeDays: Number(leadTime) || 3,
                            message,
                        })
                    ).then((ok) => ok && window.location.reload())
                }
            >
                {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Στείλε προσφορά
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
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
                Ανάθεση
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

export function CancelCaseButton({ caseId }: { caseId: string }) {
    const { pending, error, run } = useActionState()

    return (
        <div>
            <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                disabled={pending}
                onClick={() => {
                    if (!window.confirm("Ακύρωση της εργασίας; Αν έχει γίνει πληρωμή, επιστρέφεται.")) return
                    run(() => cancelLabCase(caseId)).then((ok) => ok && window.location.reload())
                }}
            >
                {pending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Ακύρωση εργασίας
            </Button>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
    )
}

/* ------------------------------------------------------------ deliverables */

export function DeliverableUpload({ caseId }: { caseId: string }) {
    const { pending, error, message, run } = useActionState()
    const [files, setFiles] = useState<File[]>([])

    return (
        <div className="space-y-3">
            <input
                type="file"
                multiple
                accept=".stl,.obj,.3mf,.zip,.step,.stp,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700"
            />
            {files.length > 0 && (
                <ul className="space-y-1 text-xs text-gray-500">
                    {files.map((file, index) => (
                        <li key={`${file.name}-${index}`}>
                            {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB
                        </li>
                    ))}
                </ul>
            )}
            <Button
                className="w-full"
                disabled={pending || files.length === 0}
                onClick={() => {
                    const formData = new FormData()
                    formData.append("kind", "OUTPUT_STL")
                    files.forEach((file) => formData.append("files", file))
                    run(() => uploadDesignerFiles(caseId, formData)).then((ok) => {
                        if (ok) {
                            setFiles([])
                            setTimeout(() => window.location.reload(), 800)
                        }
                    })
                }}
            >
                {pending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4 mr-2" />
                )}
                Ανέβασε ολοκληρωμένα αρχεία
            </Button>
            {message && <p className="text-xs text-green-700">{message}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
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
