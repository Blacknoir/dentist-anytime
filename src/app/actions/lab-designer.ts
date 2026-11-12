"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redactContactDetails } from "@/lib/lab"
import { stripe } from "@/lib/stripe"
import { getLabActor } from "@/app/actions/lab"

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
    if (!actor?.designerProfileId) return null

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
            where: { status: "OPEN" },
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

export async function getDesignerStripeStatus() {
    const actor = await getLabActor()
    if (!actor?.designerProfileId) return { isConnected: false }

    const designer = await prisma.designerProfile.findUnique({
        where: { id: actor.designerProfileId },
        select: { stripeAccountId: true },
    })
    if (!designer?.stripeAccountId) return { isConnected: false }

    try {
        const account = await stripe.accounts.retrieve(designer.stripeAccountId)
        return {
            isConnected: !!(account.details_submitted && account.payouts_enabled),
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
        }
    } catch (error: any) {
        console.error("[lab] Error retrieving designer Stripe account:", error)
        return { isConnected: false }
    }
}

export async function createDesignerStripeAccount() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const designer = await prisma.designerProfile.findUnique({
        where: { userId: session.user.id },
        include: { user: true },
    })
    if (!designer) throw new Error("Designer profile not found")

    let accountId = designer.stripeAccountId

    if (accountId) {
        try {
            await stripe.accounts.retrieve(accountId)
        } catch (error: any) {
            if (error.code === "resource_missing" || error.message?.includes("No such account")) {
                accountId = null
                await prisma.designerProfile.update({
                    where: { id: designer.id },
                    data: { stripeAccountId: null, isStripeEnabled: false },
                })
            } else {
                throw error
            }
        }
    }

    if (!accountId) {
        const account = await stripe.accounts.create({
            type: "express",
            country: "GR",
            email: session.user.email || undefined,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata: { designerProfileId: designer.id },
        })
        accountId = account.id
        await prisma.designerProfile.update({
            where: { id: designer.id },
            data: { stripeAccountId: accountId },
        })
    }

    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/lab/designer?stripe=refresh`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/lab/designer?stripe=return`,
        type: "account_onboarding",
    })

    redirect(accountLink.url)
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
