import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLegalDocumentByKey } from "@/app/actions/lab-compliance"
import { formatDate } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabLegalDocumentPage({ params }: { params: Promise<{ key: string }> }) {
    const { key } = await params
    const document = await getLegalDocumentByKey(key.toUpperCase())
    if (!document) notFound()

    return (
        <div className="pt-14 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                <Link
                    href="/lab/legal"
                    className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" /> Πίσω
                </Link>

                <Card className="mt-3">
                    <CardHeader>
                        <CardTitle className="text-xl">{document.title}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">
                            Έκδοση {document.version} · ισχύει από {formatDate(document.effectiveAt)} · SHA-256:{" "}
                            <span className="font-mono break-all">{document.contentHash}</span>
                        </p>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                            {document.body}
                        </pre>
                        <Button asChild className="mt-6">
                            <Link href="/lab/legal/consent">Αποδοχή εγγράφων</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
