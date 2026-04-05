"use server"

import { stripe } from "@/lib/stripe"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function createStripeConnectAccount() {
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized")
    }

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            user: true
        }
    })

    if (!dentist) {
        throw new Error("Dentist profile not found")
    }

    let accountId = dentist.stripeAccountId

    if (accountId) {
        try {
            // Verify the account actually exists on this Stripe environment (e.g. handle test vs live key swaps)
            await stripe.accounts.retrieve(accountId)
        } catch (error: any) {
            if (error.code === 'resource_missing' || error.message?.includes('No such account') || error.message?.includes('No such destination')) {
                console.warn(`Stripe account ${accountId} not found in this environment. Resetting.`)
                accountId = null
                await prisma.dentistProfile.update({
                    where: { id: dentist.id },
                    data: { stripeAccountId: null, isStripeEnabled: false },
                })
            } else {
                throw error
            }
        }
    }

    let accountLinkUrl = "";

    try {
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: "express",
                country: "GR", // Defaulting to Greece based on "euro" and context
                email: session.user.email || undefined,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            })

            accountId = account.id

            await prisma.dentistProfile.update({
                where: { id: dentist.id },
                data: { stripeAccountId: accountId },
            })
        }

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`, // If they cancel or it fails, go back to dashboard
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe/return`, // Success page
            type: "account_onboarding",
        })

        accountLinkUrl = accountLink.url;
    } catch (e: any) {
        console.error("Failed to create Stripe Connect account or link:", e);
        // Pass the explicit error message back to the frontend instead of throwing a hard backend exception
        // that triggers Next.js's static server rendering boundaries wrapper.
        let errMsg = e.message || "Unknown error";
        return redirect(`/dashboard?stripe_error=${encodeURIComponent(errMsg)}`)
    }

    // Safely redirect to Stripe outside the try-catch block 
    // because redirect() intrinsically throws an error itself to function!
    redirect(accountLinkUrl)
}

export async function getStripeAccountStatus() {
    const session = await auth()
    if (!session?.user?.id) return null

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist?.stripeAccountId) return { isConnected: false }

    try {
        const account = await stripe.accounts.retrieve(dentist.stripeAccountId)
        const isConnected = !!(account.details_submitted && account.charges_enabled)

        // Return status accurately based on Stripe's live response
        // Note: We don't perform the database update here anymore, as doing mutations 
        // during Server Component rendering causes Next.js errors in production.
        return {
            isConnected,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled
        }
    } catch (error: any) {
        console.error("Error retrieving Stripe account:", error)
        if (error.code === 'resource_missing' || error.message?.includes('No such account')) {
            console.warn(`Stripe account ${dentist.stripeAccountId} missing in getStripeAccountStatus. UI will reset.`)
            // Return disconnected state. The actual database wipe will safely happen 
            // inside createStripeConnectAccount when they click exactly button.
            return { isConnected: false }
        }
        return { isConnected: false }
    }
}

export async function createPaymentIntent(amount: number, dentistProfileId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { id: dentistProfileId },
        select: { stripeAccountId: true, commissionRate: true }
    })

    if (!dentist?.stripeAccountId) {
        throw new Error("Dentist is not connected to Stripe")
    }

    // Calculate application fee (commission)
    // amount is in cents
    const commissionRate = dentist.commissionRate || 10 // default to 10% if 0 or null
    const applicationFee = Math.round(amount * (commissionRate / 100))

    let paymentIntent;
    try {
        paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFee,
            transfer_data: {
                destination: dentist.stripeAccountId,
            },
            metadata: {
                dentistProfileId,
                patientId: session.user.id
            }
        });
    } catch (error: any) {
        console.error("Stripe payment intent creation error:", error);
        throw new Error(`Stripe error: ${error.message}`);
    }

    return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
    }
}
