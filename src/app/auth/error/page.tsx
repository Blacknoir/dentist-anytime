import Link from "next/link"
import { AlertTriangle, KeyRound, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

const MESSAGES: Record<string, string> = {
    Configuration:
        "Η σύνδεση με Google δεν έχει ρυθμιστεί σωστά σε αυτό το περιβάλλον. Ο διαχειριστής πρέπει να ορίσει AUTH_GOOGLE_ID και AUTH_GOOGLE_SECRET.",
    OAuthSignin: "Η σύνδεση με τον πάροχο ξεκίνησε αλλά απέτυχε. Δοκίμασε ξανά.",
    OAuthCallback: "Ο πάροχος επιστρέψε λάθος απάντηση στη σύνδεση.",
    AccessDenied: "Η σύνδεση απορρίφθηκε.",
    Verification: "Ο σύνδεσμος επιβεβαίωσης λήγησε ή χρησιμοποιήθηκε ξανά.",
    SessionRequired:
        "Πρέπει να συνδεθείς για να δεις αυτή τη σελίδα. Αν έχεις ήδη cookies από προηγούμενη σύνδεση, μπορείς να τα καθαρίσεις.",
    Default: "Η σύνδεση απέτυχε. Δοκίμασε ξανά ή χρησιμοποίησε τη σύνδεση διαχειριστή.",
}

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams
    const code = params.error || "Default"
    const message = MESSAGES[code] || MESSAGES.Default
    const googleConfigured = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16">
            <div className="w-full max-w-lg space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Η σύνδεση δεν ολοκληρώθηκε</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Κωδικός σφάλματος: <code className="font-mono">{code}</code>
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{message}</p>
                        </div>

                        {!googleConfigured && (
                            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">
                                    Το Google OAuth δεν έχει διαμορφωθεί σε αυτό το περιβάλλον, γι&apos;αυτό η σύνδεση
                                    με Google δεν μπορεί να ολοκληρωθεί. Χρησιμοποίησε τη σύνδεση διαχειριστή.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-1">
                            <Button asChild>
                                <Link href="/admin/login">
                                    <KeyRound className="h-4 w-4 mr-2" /> Σύνδεση διαχειριστή
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/lab/login">Σύνδεση Dentora Lab</Link>
                            </Button>
                            <Button variant="ghost" asChild>
                                <Link href="/">Επιστροφή στην αρχική</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
