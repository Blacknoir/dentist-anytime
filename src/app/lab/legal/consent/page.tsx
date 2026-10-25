import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsentForm } from "@/components/lab/consent-form"
import { getMissingConsents } from "@/app/actions/lab-compliance"

export const dynamic = "force-dynamic"

export default async function LabLegalConsentPage() {
    const missing = await getMissingConsents()

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Αποδοχή υποχρεωτικών εγγράφων</h1>
                <p className="text-gray-600 mt-1">
                    Κάθε έγγραφο αποδέχεται ξεχωριστά και καταγράφεται με αποδεικτικό αποδοχής.
                </p>

                <div className="mt-6">
                    <ConsentForm />
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Τι καταγράφεται</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                        <p>
                            • Αναγνωριστικό χρήστη (User ID) και ημερομηνία/ώρα αποδοχής
                            <br />• Έκδοση και SHA-256 hash του κειμένου κάθε εγγράφου
                            <br />• IP address και user agent της συσκευής
                            <br />• Μοναδικό αποδεικτικό (Evidence ID) με υπογραφή HMAC
                            <br />• Καταγραφή συμβάντος (audit event) στο αρχείο ελέγχου
                        </p>
                        {missing.length === 0 && (
                            <p className="text-green-700 font-medium">
                                Έχεις αποδεχτεί όλα τα απαιτούμενα έγγραφα στην τρέχουσα έκδοση.
                            </p>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/lab/legal/documents/terms">Διάβασε τους όρους χρήσης</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
