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

    if (!accountId) {
        const account = await stripe.accounts.create({
            type: "express",
            country: "GR", // Defaulting to Greece based on "euro" and context, probably should be dynamic or fixed to platform region
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

    redirect(accountLink.url)
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
        return {
            isConnected: account.details_submitted && account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled
        }
    } catch (error) {
        console.error("Error retrieving Stripe account:", error)
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

    const paymentIntent = await stripe.paymentIntents.create({
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
    })

    return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
    }
}
