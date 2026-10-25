import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import NewCaseForm from "@/components/lab/new-case-form"

export default function NewLabCasePage() {
    return (
        <Suspense
            fallback={
                <div className="pt-24 pb-20 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
            }
        >
            <NewCaseForm />
        </Suspense>
    )
}
