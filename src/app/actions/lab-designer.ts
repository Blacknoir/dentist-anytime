"use server"

import { revalidatePath } from "next/cache"
import type Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { redactContactDetails } from "@/lib/lab"
import {
    createConnectOnboardingLink,
    platformUrl,
    readConnectAccountState,
    stripe,
} from "@/lib/stripe"
import { getLabActor } from "@/lib/lab-domain"

export async function getDesignerProfile() {
    const actor = await getLabActor()
    if (!actor?.designerProfileId) return null

    return prisma.designerProfile.findUnique({
        where: { id: actor.designerProfileId },
        include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            services: { orderBy: { createdAt: "asc" } },
        },
    })
}

export async function updateDesignerProfile(input: {
    headline: string
    bio?: string
    city?: string
}) {
    const actor = await getLabActor()
    if (!actor?.designerProfileId) throw new Error("Μόνο CAD designers μπορούν να επεξεργάζονται το προφίλ.")

    const headline = (input.headline || "").trim()
    if (!headline) throw new Error("Γράψε μια σύντομη περιγραφή ειδικότητας.")

    await prisma.designerProfile.update({
        where: { id: actor.designerProfileId },
        data: {
            headline: redactContactDetails(headline),
            bio: input.bio ? redactContactDetails(input.bio).trim() || null : null,
            city: (input.city || "").trim() || null,
        },
    })

    revalidatePath("/lab/designer/profile")
    revalidatePath(`/lab/designers/${actor.designerProfileId}`)
    return { ok: true }
}

export async function updateDesignerServices(
    services: {
        id?: string
        name: string
        description?: string | null
        price: number
        leadTimeDays: number
        minUnits?: number
    }[]
) {
    const actor = await getLabActor()
    if (!actor?.designerProfileId) throw new Error("Μόνο CAD designers μπορούν να επεξεργάζονται τις υπηρεσίες.")
    const designerProfileId = actor.designerProfileId

    const clean = services
        .map((service) => ({
            id: service.id,
            name: (service.name || "").trim(),
            description: (service.description || "").trim() || null,
            price: Math.round(Number(service.price)),
            leadTimeDays: Math.max(1, Math.round(Number(service.leadTimeDays) || 3)),
            minUnits: Math.max(1, Math.round(Number(service.minUnits) || 1)),
        }))
        .filter((service) => service.name && Number.isFinite(service.price) && service.price > 0)

    if (!clean.length) throw new Error("Πρέπει να έχεις τουλάχιστον μία υπηρεσία με τιμή.")

    const existing = await prisma.designerService.findMany({
        where: { designerProfileId: designerProfileId },
        select: { id: true },
    })
    const existingIds = existing.map((service) => service.id)
    const keptIds = clean.map((service) => service.id).filter(Boolean) as string[]

    await prisma.$transaction([
        prisma.designerService.deleteMany({
            where: {
                designerProfileId: designerProfileId,
                id: { notIn: keptIds.length ? keptIds : ["__none__"] },
            },
        }),
        ...clean.map((service) =>
            service.id && existingIds.includes(service.id)
                ? prisma.designerService.update({
                      where: { id: service.id },
                      data: {
                          name: service.name,
                          description: service.description,
                          price: service.price,
                          leadTimeDays: service.leadTimeDays,
                          minUnits: service.minUnits,
                      },
                  })
                : prisma.designerService.create({
                      data: {
                          designerProfileId: designerProfileId,
                          name: service.name,
                          description: service.description,
                          price: service.price,
                          leadTimeDays: service.leadTimeDays,
                          minUnits: service.minUnits,
                      },
                  })
        ),
    ])

    revalidatePath("/lab/designer/profile")
    revalidatePath(`/lab/designers/${actor.designerProfileId}`)
    revalidatePath("/lab/designers")
    return { ok: true }
}

export async function getDesignerDashboard() {
    const actor = await getLabActor()
    if (!actor?.isDesigner || !actor.designerProfileId) return null

    const designerProfileId = actor.designerProfileId

    const [assignedCases, offers, openCases, profile] = await Promise.all([
        prisma.labCase.findMany({
            where: { assignedDesignerId: designerProfileId },
            orderBy: { updatedAt: "desc" },
            include: {
                customer: { select: { id: true, publicCode: true, role: true } },
                files: { orderBy: { createdAt: "asc" } },
                revisions: { orderBy: { createdAt: "desc" } },
            },
        }),
        prisma.labOffer.findMany({
            where: { designerProfileId },
            orderBy: { createdAt: "desc" },
            include: {
                case: {
                    select: {
                        id: true,
                        code: true,
                        title: true,
                        type: true,
                        material: true,
                        units: true,
                        status: true,
                        priority: true,
                        deadline: true,
                        customer: { select: { id: true, publicCode: true, role: true } },
                    },
                },
            },
        }),
        prisma.labCase.findMany({
            where: {
                status: { in: ["OPEN", "QUOTED"] },
                customerId: { not: actor.userId },
                assignedDesignerId: null,
                OR: [
                    { requestedDesignerId: null },
                    { requestedDesignerId: designerProfileId },
                ],
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            take: 20,
            select: {
                id: true,
                code: true,
                title: true,
                type: true,
                material: true,
                units: true,
                priority: true,
                deadline: true,
                createdAt: true,
                requestedDesignerId: true,
            },
        }),
        prisma.designerProfile.findUnique({
            where: { id: designerProfileId },
            select: {
                earnings: true,
                completedCases: true,
                rating: true,
                stripeAccountId: true,
                isStripeEnabled: true,
                user: { select: { publicCode: true } },
            },
        }),
    ])

    return { assignedCases, offers, openCases, profile }
}

// ---------------------------------------------------------------- stripe connect

export type DesignerStripeState =
    | "NOT_CONNECTED"
    | "ONBOARDING_INCOMPLETE"
    | "PENDING_VERIFICATION"
    | "CAPABILITY_MISSING"
    | "ACCOUNT_DISABLED"
    | "CAN_RECEIVE_PAYMENTS"
    | "UNAVAILABLE"

/**
 * The real state of the Stripe account of the designer.
 *
 * The Lab collects the money on the platform and transfers it to the designer
 * after the delivery is approved. The account therefore has to be able to
 * RECEIVE TRANSFERS (the capability "transfers"). `payouts_enabled` alone
 * says nothing about that: it only says that the account can pay out to its
 * own bank.
 *
 * The database only caches the account id, the state itself always comes from
 * Stripe, so the dashboard can never show a stale "connected".
 */
export async function getDesignerStripeStatus() {
    const actor = await getLabActor()
    if (!actor?.isDesigner || !actor.designerProfileId) {
        return { state: "NOT_CONNECTED" as DesignerStripeState, isConnected: false }
    }

    const designer = await prisma.designerProfile.findUnique({
        where: { id: actor.designerProfileId },
        select: { stripeAccountId: true, isStripeEnabled: true },
    })
    if (!designer?.stripeAccountId) {
        return { state: "NOT_CONNECTED" as DesignerStripeState, isConnected: false }
    }

    try {
        const account = await stripe.accounts.retrieve(designer.stripeAccountId)
        const state = readConnectAccountState(account, "PLATFORM_TRANSFER")
        const onboardingState: DesignerStripeState = state.usable
            ? "CAN_RECEIVE_PAYMENTS"
            : state.disabledReason === "requirements.pending_verification"
              ? "PENDING_VERIFICATION"
              : state.disabledReason === "requirements.past_due" || state.disabledReason === "requirements.fields_needed"
                ? "ONBOARDING_INCOMPLETE"
                : state.reason

        // Keep the cached flag in sync with Stripe.
        const enabled = state.usable
        if (designer.isStripeEnabled !== enabled) {
            await prisma.designerProfile.updateMany({
                where: { id: actor.designerProfileId, stripeAccountId: designer.stripeAccountId },
                data: { isStripeEnabled: enabled },
            })
        }

        return {
            state: onboardingState,
            isConnected: state.usable,
            detailsSubmitted: state.detailsSubmitted,
            transfersActive: state.transfersActive,
            payoutsEnabled: state.payoutsEnabled,
            currentlyDue: state.currentlyDue,
            accountId: designer.stripeAccountId,
        }
    } catch (error) {
        console.error("[lab] Error retrieving designer Stripe account:", error)
        if (isMissingStripeAccount(error)) {
            return { state: "NOT_CONNECTED" as DesignerStripeState, isConnected: false }
        }
        return { state: "UNAVAILABLE" as DesignerStripeState, isConnected: false }
    }
}

/**
 * Starts (or continues) the Stripe Connect onboarding of the designer.
 *
 * The account is created only once: the account id is kept in the database
 * and the Stripe call uses an idempotency key. The onboarding link is
 * single use and expires, so every call creates a fresh link.
 */
export async function startDesignerStripeOnboarding(): Promise<
    { ok: true; url: string } | { ok: false; message: string }
> {
    try {
        const actor = await getLabActor()
        if (!actor) return { ok: false, message: "Πρέπει να είσαι συνδεδεμένος." }
        if (!actor.isDesigner || !actor.designerProfileId) {
            return { ok: false, message: "Χρειάζεται ενεργό προφίλ CAD designer για τη σύνδεση με το Stripe." }
        }

        const baseUrl = platformUrl()
        if (!baseUrl) {
            console.error("[lab] Stripe Connect is missing NEXT_PUBLIC_APP_URL")
            return { ok: false, message: "Η σύνδεση με το Stripe δεν είναι διαθέσιμη αυτή τη στιγμή." }
        }

        const designer = await prisma.designerProfile.findUniqueOrThrow({
            where: { id: actor.designerProfileId },
            select: { id: true, stripeAccountId: true },
        })
        let accountId = designer.stripeAccountId

        if (accountId) {
            try {
                await stripe.accounts.retrieve(accountId)
            } catch (error) {
                if (!isMissingStripeAccount(error)) throw error
                accountId = null
            }
        }

        if (!accountId) {
            const key = designer.stripeAccountId
                ? `designer:acct:${designer.id}:${designer.stripeAccountId}`
                : `designer:acct:${designer.id}`
            const account = await createDesignerConnectAccount(designer.id, actor.email, key)
            accountId = account.id
            await prisma.designerProfile.update({
                where: { id: designer.id },
                data: { stripeAccountId: accountId, isStripeEnabled: false },
            })
        }

        const accountLink = await createConnectOnboardingLink({
            accountId,
            refreshUrl: `${baseUrl}/lab/designer?stripe=refresh`,
            returnUrl: `${baseUrl}/lab/designer?stripe=return`,
        })
        return { ok: true, url: accountLink.url }
    } catch (error) {
        console.error("[lab] Could not start Stripe Connect for designer:", error)
        return { ok: false, message: "Δεν ήταν δυνατή η σύνδεση με το Stripe. Δοκίμασε ξανά σε λίγο." }
    }
}

async function createDesignerConnectAccount(designerId: string, email: string, idempotencyKey: string) {
    const params: Stripe.AccountCreateParams = {
        type: "express",
        country: "GR",
        email: email || undefined,
        capabilities: { transfers: { requested: true } },
        metadata: { designerProfileId: designerId },
    }
    try {
        return await stripe.accounts.create(params, { idempotencyKey })
    } catch (error) {
        // Some platforms need Stripe approval for transfer-only Express accounts.
        // Use the same capabilities as dentist onboarding only on this specific rejection.
        if (!(error instanceof Error && "type" in error && error.type === "StripeInvalidRequestError" &&
            /transfers.*without.*card_payments/i.test(error.message))) throw error

        return stripe.accounts.create({
            ...params,
            capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
        }, { idempotencyKey: `${idempotencyKey}:with-card-payments` })
    }
}

function isMissingStripeAccount(error: unknown) {
    if (typeof error !== "object" || error === null) return false
    if ("code" in error && error.code === "resource_missing") return true
    return error instanceof Error && error.message.includes("No such account")
}

/**
 * Reads the state of the account after the onboarding and stores it. Called
 * when the designer comes back from Stripe.
 */
export async function syncDesignerStripeAccount() {
    const status = await getDesignerStripeStatus()
    return status
}

// ---------------------------------------------------------------- lab (οδοντοτεχνικό εργαστήριο)

export async function getLabProfile() {
    const actor = await getLabActor()
    if (!actor || actor.role !== "LAB") return null

    return prisma.labProfile.findUnique({
        where: { userId: actor.userId },
        include: { user: { select: { name: true, email: true } } },
    })
}

export async function updateLabProfile(input: {
    labName: string
    city?: string
    about?: string
    equipment?: string[]
    materials?: string[]
}) {
    const actor = await getLabActor()
    if (!actor || actor.role !== "LAB") throw new Error("Μόνο εργαστήρια μπορούν να επεξεργάζονται το προφίλ.")

    const labName = (input.labName || "").trim()
    if (!labName) throw new Error("Γράψε το όνομα του εργαστηρίου.")

    const data = {
        labName,
        city: (input.city || "").trim() || null,
        about: input.about ? redactContactDetails(input.about).trim() || null : null,
        equipment: (input.equipment || []).filter(Boolean),
        materials: (input.materials || []).filter(Boolean),
    }

    const existing = await prisma.labProfile.findUnique({ where: { userId: actor.userId } })
    if (existing) {
        await prisma.labProfile.update({ where: { id: existing.id }, data })
    } else {
        await prisma.labProfile.create({ data: { ...data, userId: actor.userId } })
    }

    revalidatePath("/lab/labs")
    revalidatePath("/lab/designer/profile")
    return { ok: true }
}
