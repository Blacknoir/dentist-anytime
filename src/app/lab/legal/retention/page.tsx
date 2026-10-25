import Link from "next/link"
import { ArrowLeft, DatabaseBackup, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeletionRequestForm } from "@/components/lab/compliance-forms"
import { LAB_RETENTION_POLICY, LAB_SECURITY_CONTROLS } from "@/lib/lab-processors"
import { formatDate } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabRetentionPage() {
    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Διατήρηση, backups & διαγραφή</h1>
                <p className="text-gray-600 mt-1">
                    Πότε διατηρούμε κάθε κατηγορία δεδομένων, τι γίνεται με τα backups και πώς ζητάτε
                    οριστική διαγραφή.
                </p>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <DatabaseBackup className="h-4 w-4" /> Πολιτική διατήρησης
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-gray-100">
                            {LAB_RETENTION_POLICY.map((entry) => (
                                <div key={entry.item} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                                    <span className="text-gray-700">{entry.item}</span>
                                    <span className="font-semibold text-gray-900">{entry.period}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Διαδικασία διαγραφής
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-gray-600">
                        <ol className="list-decimal list-inside space-y-1.5">
                            <li>Υποβάλλετε αίτημα διαγραφής μέσω της παρακάτω φόρμας.</li>
                            <li>Εντός 30 ημερών διαγράφονται τα αρχεία, οι εργασίες και οι προσφορές σας.</li>
                            <li>
                                Τα backups δεν διαγράφονται άμεσα, αλλά λήγουν αυτόματα στον κύκλο ζωής τους (30
                                ημέρες) — μετά δεν είναι πλέον ανακτήσιμα.
                            </li>
                            <li>
                                Οι αποδείξεις συγκατάθεσης και οι εγγραφές ελέγχου διατηρούνται 5 έτη, χωρίς
                                δεδομένα που να επιτρέπουν αναγνώριση ιατρικών δεδομένων.
                            </li>
                            <li>Τα συναλλακτικά/φορολογικά δεδομένα διατηρούνται 10 έτη (νομική υποχρέωση).</li>
                        </ol>
                    </CardContent>
                </Card>

                <div className="mt-6">
                    <DeletionRequestForm />
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Μέτρα ασφαλείας</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {LAB_SECURITY_CONTROLS.map((control) => (
                            <div key={control.title} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <h3 className="font-bold text-gray-900 text-sm">{control.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{control.text}</p>
                            </div>
                        ))}
                        <p className="text-xs text-gray-400">
                            Τελευταία ενημέρωση πολιτικής: {formatDate(new Date())}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
