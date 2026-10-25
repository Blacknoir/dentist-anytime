import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LAB_SUBPROCESSORS } from "@/lib/lab-processors"

export const dynamic = "force-dynamic"

export default function LabSubprocessorsPage() {
    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <Link href="/lab/legal" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-3">Υπεκτελούντες & συμβάσεις</h1>
                <p className="text-gray-600 mt-1">
                    Κατάλογος των υπεκτελούντων της πλατφόρμας (cloud providers, βάση, αποθήκευση,
                    πληρωμές, identity). Κάθε αλλαγή στον κατάλογο γνωστοποιείται στους χρήστες του Lab.
                </p>

                <div className="mt-6 space-y-4">
                    {LAB_SUBPROCESSORS.map((processor) => (
                        <Card key={processor.name}>
                            <CardHeader>
                                <CardTitle className="text-base">{processor.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-[11px] uppercase font-bold text-gray-400">Σκοπός</div>
                                    <p className="text-gray-700">{processor.purpose}</p>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase font-bold text-gray-400">
                                        Κατηγορίες δεδομένων
                                    </div>
                                    <p className="text-gray-700">{processor.dataCategories}</p>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase font-bold text-gray-400">
                                        Τοποθεσία
                                    </div>
                                    <p className="text-gray-700">{processor.location}</p>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase font-bold text-gray-400">
                                        Εγγυήσεις
                                    </div>
                                    <p className="text-gray-700">{processor.safeguards}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <a
                                        href={processor.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-primary-700 font-semibold text-sm hover:underline"
                                    >
                                        Σύμβαση επεξεργασίας δεδομένων (DPA)
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base">Ρόλοι και ευθύνες</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                        <p>
                            • <strong>Υπεύθυνος επεξεργασίας:</strong> Dentora για τα δεδομένα λογαριασμού,
                            συμβάσεων, καταγραφών και αποδείξεων.
                            <br />• <strong>Επεξεργαστής:</strong> Dentora για τα αρχεία CAD, τις
                            καταγραφές πρόσβασης και τη διανομή αρχείων προς τον επιλεγμένο συνεργάτη.
                            <br />• <strong>Υπεύθυνος επεξεργασίας (χρήστης):</strong> ο οδοντίατρος, το
                            εργαστήριο ή ο designer για τα δεδομένα ασθενών που μεταφορτώνει, με δήλωση
                            νόμιμης βάσης.
                        </p>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/lab/legal/documents/dpa">Διάβασε τη σύμβαση επεξεργασίας</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
