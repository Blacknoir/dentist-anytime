"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    executeDeletionRequest,
    reviewVerificationRequest,
    updateSecurityIncident,
} from "@/app/actions/lab-compliance"

export function ReviewVerificationButtons({ requestId }: { requestId: string }) {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const decide = async (decision: "APPROVED" | "REJECTED") => {
        setPending(true)
        setError(null)
        try {
            await reviewVerificationRequest(requestId, decision)
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η ενέργεια απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button size="sm" disabled={pending} onClick={() => decide("APPROVED")}>
                {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Έγκριση
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => decide("REJECTED")}>
                <X className="h-4 w-4 mr-1" /> Απόρριψη
            </Button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    )
}

export function IncidentStatusSelect({ incidentId, status }: { incidentId: string; status: string }) {
    const router = useRouter()
    const [pending, setPending] = useState(false)

    const update = async (value: string) => {
        setPending(true)
        try {
            await updateSecurityIncident(incidentId, value)
            router.refresh()
        } finally {
            setPending(false)
        }
    }

    return (
        <select
            defaultValue={status}
            disabled={pending}
            onChange={(event) => update(event.target.value)}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
        >
            {["REPORTED", "TRIAGED", "INVESTIGATING", "RESOLVED", "DISCLOSED"].map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    )
}

export function ExecuteDeletionButton({ requestId }: { requestId: string }) {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const run = async () => {
        if (!window.confirm("Εκτέλεση διαγραφής; Η ενέργεια είναι οριστική.")) return
        setPending(true)
        setError(null)
        try {
            await executeDeletionRequest(requestId)
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η διαγραφή απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={pending} onClick={run}>
                {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Εκτέλεση διαγραφής
            </Button>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    )
}
