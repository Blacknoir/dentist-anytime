import { getDashboardStats } from "@/app/actions/dashboard"
import { createStripeConnectAccount } from "@/app/actions/stripe"
import { signInWithGoogle } from "@/app/actions/auth"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    const signInWithGoogleAction = signInWithGoogle.bind(null, "DENTIST")

    return (
        <DashboardClient
            stats={stats}
            signInWithGoogleAction={signInWithGoogleAction}
            createStripeConnectAccountAction={createStripeConnectAccount}
        />
    )
}
