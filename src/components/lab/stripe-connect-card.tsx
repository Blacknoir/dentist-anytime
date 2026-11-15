"use client"

import { useState, useTransition } from "react"
import { AlertCircle, CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startDesignerStripeOnboarding } from "@/app/actions/lab-designer"
import type { DesignerStripeState } from "@/app/actions/lab-designer"

export function StripeConnectCard({
    state,
    currentlyDue = [],
}: {
    state: DesignerStripeState
    currentlyDue?: string[]
}) {
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const connect = () => {
        setError(null)
        startTransition(async () => {
            try {
                const result = await startDesignerStripeOnboarding()
                if (result.ok) {
                    window.location.assign(result.url)
                } else {
                    setError(result.message)
                }
            } catch {
                setError("Η σύνδεση με το Stripe απέτυχε. Δοκίμασε ξανά.")
            }
        })
    }
    const errorNotice = error && (
        <p role="alert" className="w-full text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
        </p>
    )

    if (state === "CAN_RECEIVE_PAYMENTS") {
        return (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                    Το Stripe είναι συνδεδεμένο — μπορείς να λαμβάνεις πληρωμές για τις εργασίες σου.
                </span>
            </div>
        )
    }

    if (state === "PENDING_VERIFICATION") {
        return (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        Ο λογαριασμός σου στο Stripe είναι σε αναμονή επαλήθευσης. Μόλις εγκριθεί, μπορείς να
                        λαμβάνεις πληρωμές για τις εργασίες σου.
                        {currentlyDue.length > 0 && (
                            <span className="block text-xs mt-1 opacity-80">
                                Εκκρεμούν: {currentlyDue.join(", ")}
                            </span>
                        )}
                    </span>
                </span>
                <Button size="sm" variant="outline" onClick={connect} disabled={pending}>
                    {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Άνοιξε το Stripe
                </Button>
                {errorNotice}
            </div>
        )
    }

    if (state === "CAPABILITY_MISSING") {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        Ο λογαριασμός σου στο Stripe δεν μπορεί ακόμα να δεχτεί μεταφορές από την πλατφόρμα
                        (η δυνατότητα «transfers» δεν είναι ενεργή). Άνοιξε το Stripe για να την
                        ενεργοποιήσεις.
                    </span>
                </span>
                <Button size="sm" variant="outline" onClick={connect} disabled={pending}>
                    {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Άνοιξε το Stripe
                </Button>
                {errorNotice}
            </div>
        )
    }

    if (state === "ACCOUNT_DISABLED") {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                        Ο λογαριασμός σου στο Stripe είναι απενεργοποιημένος. Επικοινώνησε με την ομάδα
                        υποστήριξης ώστε να ενεργοποιηθεί ξανά.
                    </span>
                </span>
            </div>
        )
    }


    if (state === "UNAVAILABLE") {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    Δεν είναι δυνατή η επικοινωνία με το Stripe αυτή τη στιγμή. Δοκίμασε ξανά.
                </span>
                <Button size="sm" variant="outline" onClick={connect} disabled={pending}>
                    {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Δοκίμασε ξανά
                </Button>
                {errorNotice}
            </div>
        )
    }

    const isIncomplete = state === "ONBOARDING_INCOMPLETE"

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-start gap-2">
                <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                {isIncomplete
                    ? "Η σύνδεση με το Stripe δεν ολοκληρώθηκε. Συνέχισε από τον σύνδεσμο για να λάβεις τις πληρωμές σου."
                    : "Σύνδεσε το Stripe για να λαμβάνεις τις πληρωμές των εργασιών σου."}
            </span>
            <Button size="sm" variant="outline" onClick={connect} disabled={pending}>
                {pending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                    <CreditCard className="h-4 w-4 mr-1" />
                )}
                {isIncomplete ? "Συνέχισε τη σύνδεση" : "Σύνδεση Stripe"}
            </Button>
            {errorNotice}
        </div>
    )
}
