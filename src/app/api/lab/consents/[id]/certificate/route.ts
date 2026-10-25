import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { buildConsentEvidence } from "@/app/actions/lab-compliance"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const evidence = await buildConsentEvidence(id)
        const format = new URL(_request.url).searchParams.get("format")

        if (format === "html") {
            const html = `<!doctype html>
<html lang="el"><head><meta charset="utf-8"><title>Αποδεικτικό αποδοχής ${evidence.evidenceId}</title>
<style>body{font-family:system-ui,Arial,sans-serif;margin:40px;color:#111}table{border-collapse:collapse;margin-top:20px}td{border:1px solid #ddd;padding:8px 12px;font-size:13px}td:first-child{background:#f6f7f9;font-weight:600;width:220px}h1{font-size:20px}</style>
</head><body>
<h1>Αποδεικτικό αποδοχής όρων — Dentora Lab</h1>
<p>Το παρόν αποτελεί ηλεκτρονική απόδειξη αποδοχής του χρήστη από την πλατφόρμα Dentora.</p>
<table>
<tr><td>Αποδεικτικό (Evidence ID)</td><td>${evidence.evidenceId}</td></tr>
<tr><td>Χρήστης</td><td>${evidence.userName || ""} (${evidence.userEmail || ""})</td></tr>
<tr><td>Αναγνωριστικό χρήστη (User ID)</td><td>${evidence.userId}</td></tr>
<tr><td>Έγγραφο</td><td>${evidence.documentTitle}</td></tr>
<tr><td>Έκδοση</td><td>${evidence.documentVersion}</td></tr>
<tr><td>SHA-256 εγγράφου</td><td>${evidence.documentHash}</td></tr>
<tr><td>Ημερομηνία & ώρα αποδοχής</td><td>${evidence.acceptedAt.toISOString()}</td></tr>
<tr><td>IP address</td><td>${evidence.ipAddress || "—"}</td></tr>
<tr><td>Υπογραφή (HMAC-SHA256)</td><td>${evidence.signature}</td></tr>
</table>
<p style="margin-top:24px;font-size:12px;color:#666">Η υπογραφή επαληθεύεται στο <code>/lab/legal/verify?evidence=${evidence.evidenceId}&amp;signature=${evidence.signature}</code>.</p>
</body></html>`

            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Content-Disposition": `inline; filename="consent-${evidence.evidenceId}.html"`,
                },
            })
        }

        return new NextResponse(JSON.stringify(evidence, null, 2), {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Content-Disposition": `attachment; filename="consent-${evidence.evidenceId}.json"`,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Unauthorized" }, { status: 403 })
    }
}
