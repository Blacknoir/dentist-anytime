import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function StripeReturnPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="p-4 bg-green-50 text-green-600 rounded-full">
                <CheckCircle className="h-12 w-12" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Payment Setup Complete!</h1>
                <p className="text-gray-500 max-w-md mx-auto">
                    Your Stripe account has been successfully connected. You can now accept payments for your bookings.
                </p>
            </div>
            <Button asChild className="mt-8">
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    )
}
