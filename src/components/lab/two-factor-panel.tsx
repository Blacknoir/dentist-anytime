"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, KeyRound, Loader2, ShieldCheck, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    confirmTwoFactorEnrollment,
    disableTwoFactor,
    startTwoFactorEnrollment,
} from "@/app/actions/lab-compliance"

export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
    const router = useRouter()
    const [stage, setStage] = useState<"idle" | "enrolling" | "confirming">("idle")
    const [secret, setSecret] = useState("")
    const [otpauthUrl, setOtpauthUrl] = useState("")
    const [code, setCode] = useState("")
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const begin = async () => {
        setPending(true)
        setError(null)
        try {
            const result = await startTwoFactorEnrollment()
            setSecret(result.secret)
            setOtpauthUrl(result.otpauthUrl)
            setStage("enrolling")
        } catch (err: any) {
            setError(err?.message || "Αποτυχία ενεργοποίησης.")
        } finally {
            setPending(false)
        }
    }

    const confirm = async () => {
        setPending(true)
        setError(null)
        try {
            const result = await confirmTwoFactorEnrollment(code)
            setRecoveryCodes(result.recoveryCodes)
            setCode("")
            setStage("idle")
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Λανθασμένος κωδικός.")
        } finally {
            setPending(false)
        }
    }

    const disable = async () => {
        setPending(true)
        setError(null)
        try {
            await disableTwoFactor(code)
            setCode("")
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Αποτυχία απενεργοποίησης.")
        } finally {
            setPending(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4" /> Δική μου ταυτοποίηση σε δύο βήματα (2FA)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {enabled && stage === "idle" && (
                    <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                        Το 2FA είναι ενεργοποιημένο. Απαιτείται για τη λήψη αρχείων εργασιών.
                    </div>
                )}

                {stage === "enrolling" && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            Πρόσθεσε το κλειδί στην εφαρμογή authenticator (Google Authenticator, Microsoft
                            Authenticator, 1Password) και συμπλήρωσε τον 6ψηφιο κωδικό.
                        </p>
                        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                            <div className="text-xs uppercase font-bold text-gray-400">Κλειδί (secret)</div>
                            <code className="text-sm break-all text-gray-800">{secret}</code>
                            <div className="text-xs text-gray-400 mt-2 break-all">{otpauthUrl}</div>
                        </div>
                        <Input
                            placeholder="6ψηφιος κωδικός"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <Button className="w-full" disabled={pending || code.length !== 6} onClick={confirm}>
                            {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Ενεργοποίηση 2FA
                        </Button>
                    </div>
                )}

                {enabled && stage === "idle" && (
                    <div className="space-y-2">
                        <Input
                            placeholder="Κωδικός 2FA ή κωδικός ανάκτησης"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                        />
                        <Button variant="outline" size="sm" disabled={pending || !code} onClick={disable}>
                            Απενεργοποίηση 2FA
                        </Button>
                    </div>
                )}

                {!enabled && stage === "idle" && (
                    <>
                        <p className="text-sm text-gray-600">
                            Προσθέτει ένα επιπλέον επίπεδο στα αρχεία εργασιών. Συνιστάται για κάθε οδοντίατρος,
                            εργαστήριο και CAD designer που χειρίζεται αρχεία ασθενών.
                        </p>
                        <Button onClick={begin} disabled={pending}>
                            {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                            Ενεργοποίηση 2FA
                        </Button>
                    </>
                )}

                {recoveryCodes.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                            <TriangleAlert className="h-4 w-4" /> Κωδικοί ανάκτησης (αποθήκευσέ τους)
                        </p>
                        <ul className="grid grid-cols-2 gap-1 mt-2 font-mono text-xs text-amber-900">
                            {recoveryCodes.map((recovery) => (
                                <li key={recovery}>{recovery}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
