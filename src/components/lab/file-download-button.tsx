"use client"

import { useState } from "react"
import { Download, KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { verifyTwoFactor } from "@/app/actions/lab-compliance"

export function FileDownloadButton({ fileId, fileName }: { fileId: string; fileName: string }) {
    const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
    const [code, setCode] = useState("")
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const download = async (retry = false) => {
        setPending(true)
        setError(null)
        try {
            const response = await fetch(`/api/lab/files/${fileId}`)

            if (response.status === 401) {
                const payload = await response.json().catch(() => ({}))
                if (payload?.error === "two_factor_required") {
                    setNeedsTwoFactor(true)
                    return
                }
                setError("Η λήψη απαιτεί σύνδεση.")
                return
            }

            if (!response.ok) {
                setError("Δεν επιτρέπεται η λήψη αυτού του αρχείου.")
                return
            }

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } catch {
            setError("Η λήψη απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    const verify = async () => {
        setPending(true)
        setError(null)
        try {
            await verifyTwoFactor(code)
            setNeedsTwoFactor(false)
            setCode("")
            await download(true)
        } catch (err: any) {
            setError(err?.message || "Λανθασμένος κωδικός 2FA.")
        } finally {
            setPending(false)
        }
    }

    if (needsTwoFactor) {
        return (
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                    <Input
                        placeholder="Κωδικός 2FA"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        className="h-8 w-28 text-xs"
                    />
                    <Button size="sm" disabled={pending || code.length !== 6} onClick={verify}>
                        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Επιβεβαίωση"}
                    </Button>
                </div>
                {error && <span className="text-[11px] text-red-600">{error}</span>}
            </div>
        )
    }

    return (
        <span className="flex items-center gap-2">
            <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-primary-700 hover:text-primary-800"
                disabled={pending}
                onClick={() => download()}
            >
                {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <>
                        <Download className="h-3.5 w-3.5" /> Λήψη
                    </>
                )}
            </Button>
            {error && <span className="text-[11px] text-red-600">{error}</span>}
        </span>
    )
}
