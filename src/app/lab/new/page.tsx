import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import NewCaseForm from "@/components/lab/new-case-form"
import { effectiveMaxFileSize, getUploadLimits } from "@/lib/lab-uploads"

export const dynamic = "force-dynamic"

export default function NewLabCasePage() {
    return (
        <Suspense
            fallback={
                <div className="pt-24 pb-20 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
            }
        >
            <NewCaseForm maxFileSize={effectiveMaxFileSize(getUploadLimits().provider)} />
        </Suspense>
    )
}
