import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { StripeReturnClient } from "./stripe-return-client"

export default async function StripeReturnPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    // Find the dentist profile
    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id },
    })

    let isFullyConnected = false

    if (dentist?.stripeAccountId) {
        try {
            // Verify the Stripe account status
            const account = await stripe.accounts.retrieve(dentist.stripeAccountId)

            if (account.details_submitted && account.charges_enabled) {
                // Account is fully set up - enable Stripe on the profile
                await prisma.dentistProfile.update({
                    where: { id: dentist.id },
                    data: { isStripeEnabled: true },
                })
                isFullyConnected = true
            }
        } catch (error) {
            console.error("Error verifying Stripe account:", error)
        }
    }

    return <StripeReturnClient isFullyConnected={isFullyConnected} />
}
