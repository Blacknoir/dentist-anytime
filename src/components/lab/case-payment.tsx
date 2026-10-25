"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { CheckCircle2, CreditCard, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createCasePaymentIntent } from "@/app/actions/lab"
import { euros } from "@/lib/lab"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function LabPaymentForm({ amountCents, onPaid }: { amountCents: number; onPaid: () => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)
        setError(null)

        try {
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            })

            if (confirmError) {
                setError(confirmError.message ?? "Η πληρωμή απέτυχε.")
                setLoading(false)
                return
            }

            if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
                onPaid()
                return
            }

            setError(`Κατάσταση πληρωμής: ${paymentIntent?.status ?? "άγνωστη"}.`)
            setLoading(false)
        } catch (err: any) {
            setError(err?.message || "Ένα απροσμέλοτο σφάλμα συνέβη.")
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />
            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
            )}
            <Button type="submit" disabled={!stripe || loading} className="w-full">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Επεξεργασία...
                    </>
                ) : (
                    <>
                        <Lock className="mr-2 h-4 w-4" /> Πλήρωσε {euros(amountCents / 100)}
                    </>
                )}
            </Button>
        </form>
    )
}

/**
 * Payment panel for a CAD case. The money is held on the platform (escrow)
 * and is transferred to the designer only after the customer approves.
 */
export function CasePaymentPanel({
    caseId,
    amountCents,
    feeCents,
    payoutCents,
    paymentStatus,
}: {
    caseId: string
    amountCents: number
    feeCents: number
    payoutCents: number
    paymentStatus: string
}) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [paid, setPaid] = useState(paymentStatus === "HELD" || paymentStatus === "RELEASED")

    useEffect(() => {
        let cancelled = false

            const start = async () => {
                try {
                    const result = await createCasePaymentIntent(caseId)
                    if (cancelled) return
                    if ("clientSecret" in result && result.clientSecret) {
                        setClientSecret(result.clientSecret)
                    } else if ("error" in result && result.error) {
                        setError(result.error)
                    }
                } catch (err: any) {
                    if (!cancelled) setError(err?.message || "Αποτυχία δημιουργίας πληρωμής.")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            }

        if (!paid) start()
        else setLoading(false)

        return () => {
            cancelled = true
        }
    }, [caseId, paid])

    if (paid) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Η πληρωμή καταχωρίστηκε
                </div>
                <p className="text-xs">
                    Τα χρήματα κρατούνται σε ασφάλεια και θα μεταφερθούν στον designer μόλις εγκρίνεις την
                    παράδοση.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                    <span className="text-gray-500">Σύνολο εργασίας</span>
                    <strong>{euros(amountCents / 100)}</strong>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Προμήθεια Dentora</span>
                    <strong>{euros(feeCents / 100)}</strong>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5">
                    <span className="text-gray-500">Πληρωμή στον designer</span>
                    <strong>{euros(payoutCents / 100)}</strong>
                </div>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Προετοιμασία πληρωμής…
                </div>
            )}

            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>
            )}

            {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <LabPaymentForm
                        amountCents={amountCents}
                        onPaid={() => {
                            setPaid(true)
                            window.location.reload()
                        }}
                    />
                </Elements>
            )}

            <p className="flex items-start gap-1.5 text-[11px] text-gray-400">
                <CreditCard className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                Τα χρήματα παραμένουν στη Dentora μέχρι την έγκρισή σου. Ο designer πληρώνεται αυτόματα μετά.
            </p>
        </div>
    )
}
