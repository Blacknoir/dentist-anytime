"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import {
    computeSplit,
    generateCaseCode,
    inferFileKind,
    INPUT_FILE_KINDS,
    LAB_PLATFORM_FEE_RATE,
    OUTPUT_FILE_KINDS,
    publicCodeFor,
    redactContactDetails,
    type LabFileKind,
} from "@/lib/lab"
import {
    ACCEPTED_EXTENSIONS,
    hasAcceptedExtension,
    MAX_UPLOAD_BYTES,
    storeLabFile,
} from "@/lib/lab-storage"

export type LabActor = {
    userId: string
    role: string
    name: string
    email: string
    publicCode: string
    designerProfileId: string | null
    isCustomer: boolean
    isDesigner: boolean
    isAdmin: boolean
}

export async function getLabActor(): Promise<LabActor | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            role: true,
            name: true,
            email: true,
            publicCode: true,
            designerProfile: { select: { id: true } },
        },
    })
    if (!user) return null

    const role = user.role
    return {
        userId: user.id,
        role,
        name: user.name || "Χρήστης",
        email: user.email || "",
        publicCode: publicCodeFor(user),
        designerProfileId: user.designerProfile?.id ?? null,
        isCustomer: role === "DENTIST" || role === "LAB",
        isDesigner: role === "DESIGNER" && !!user.designerProfile,
        isAdmin: role === "ADMIN",
    }
}

async function requireActor(): Promise<LabActor> {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος για αυτή τη δράση.")
    return actor
}

async function assertLabConsents(userId: string) {
    const documents = await prisma.legalDocument.findMany()
    const latest = new Map<string, (typeof documents)[number]>()
    for (const document of documents) {
        const current = latest.get(document.key)
        if (!current || document.effectiveAt > current.effectiveAt) latest.set(document.key, document)
    }

    const consents = await prisma.documentConsent.findMany({
        where: { userId, scope: "LAB" },
    })

    const missing = ["TERMS", "DPA", "PRIVACY"].filter((key) => {
        const document = latest.get(key)
        if (!document) return true
        return !consents.some(
            (consent) =>
                consent.documentKey === key &&
                consent.documentVersion === document.version &&
                consent.documentHash === document.contentHash
        )
    })

    if (missing.length > 0) {
        throw new Error(
            "Πρέπει να αποδεχτείς τα υποχρεωτικά έγγραφα (Όροι χρήσης, Σύμβαση Επεξεργασίας Δεδομένων, Πολιτική Απορρήτου) στη σελίδα /lab/legal/consent."
        )
    }
}

// ---------------------------------------------------------------- cases

export async function createLabCase(formData: FormData) {
    const actor = await requireActor()
    if (!actor.isCustomer && !actor.isAdmin) {
        throw new Error("Μόνο οδοντίατρες και εργαστήρια μπορούν να δημιουργήσουν εργασία.")
    }
    await assertLabConsents(actor.userId)

    const type = String(formData.get("type") || "").trim()
    const material = String(formData.get("material") || "").trim()
    const title = String(formData.get("title") || "").trim()
    const description = String(formData.get("description") || "").trim()
    const shade = String(formData.get("shade") || "").trim() || null
    const units = Math.max(1, Number(formData.get("units")) || 1)
    const priority = String(formData.get("priority") || "STANDARD") === "EXPRESS" ? "EXPRESS" : "STANDARD"
    const deadlineRaw = String(formData.get("deadline") || "").trim()
    const designerId = String(formData.get("designerId") || "").trim() || null

    if (!type || !material || !description) {
        throw new Error("Συμπλήρωσε είδος, υλικό και περιγραφή.")
    }

    const deadline = deadlineRaw ? new Date(deadlineRaw) : null

    const code = generateCaseCode()
    const customerType = actor.role === "LAB" ? "LAB" : "DENTIST"

    const created = await prisma.labCase.create({
        data: {
            code,
            title: title || `${type} · ${material}`,
            type,
            material,
            shade,
            units,
            description,
            deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
            priority,
            customerId: actor.userId,
            customerType,
            status: "OPEN",
        },
    })

    // Optional: the case is created directly for a specific designer.
    if (designerId) {
        const designer = await prisma.designerProfile.findUnique({
            where: { id: designerId },
            include: { services: { where: { isActive: true } } },
        })
        if (designer && designer.services.length > 0) {
            const service = designer.services[0]
            const split = computeSplit(service.price)
            await prisma.labCase.update({
                where: { id: created.id },
                data: {
                    assignedDesignerId: designer.id,
                    agreedPrice: service.price,
                    platformFee: split.fee,
                    designerPayout: split.payout,
                    status: "ASSIGNED",
                },
            })
        }
    }

    await uploadCaseFiles(created.id, formData, "CUSTOMER", INPUT_FILE_KINDS)

    revalidatePath("/lab/cases")
    revalidatePath("/lab")

    return { id: created.id, code }
}

export async function getLabCases(filter?: {
    scope?: "open" | "mine" | "assigned"
    status?: string
    query?: string
    designerId?: string
}) {
    const actor = await getLabActor()
    const scope = filter?.scope ?? "open"

    const where: Record<string, any> = {}

    if (scope === "mine") {
        if (!actor) return []
        where.customerId = actor.userId
    } else if (scope === "assigned") {
        if (!actor?.designerProfileId) return []
        where.assignedDesignerId = actor.designerProfileId
    } else {
        where.status = { in: ["OPEN", "QUOTED"] }
    }

    if (filter?.status) where.status = filter.status
    if (filter?.designerId) where.assignedDesignerId = filter.designerId
    if (filter?.query) {
        where.OR = [
            { code: { contains: filter.query, mode: "insensitive" } },
            { title: { contains: filter.query, mode: "insensitive" } },
            { description: { contains: filter.query, mode: "insensitive" } },
            { type: { contains: filter.query, mode: "insensitive" } },
            { material: { contains: filter.query, mode: "insensitive" } },
        ]
    }

    return prisma.labCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            // Only the anonymous code travels to the browser — never a real name.
            customer: { select: { id: true, role: true } },
            assignedDesigner: { select: { id: true } },
            _count: { select: { files: true, offers: true, revisions: true } },
        },
        take: 100,
    })
}

export async function getLabCaseById(id: string) {
    return prisma.labCase.findUnique({
        where: { id },
        include: {
            // The customer name is only rendered for the owner and the admins.
            customer: { select: { id: true, publicCode: true, role: true, name: true } },
            assignedDesigner: {
                include: {
                    // The designer identity stays anonymous for everyone else.
                    user: { select: { id: true, publicCode: true, image: true } },
                    services: { where: { isActive: true } },
                },
            },
            files: { orderBy: { createdAt: "asc" } },
            offers: {
                orderBy: { price: "asc" },
                include: {
                    designerProfile: {
                        include: { user: { select: { id: true, publicCode: true, image: true } } },
                    },
                },
            },
            revisions: { orderBy: { createdAt: "desc" } },
        },
    })
}

/** True when the current user may see the full case (files, prices). */
export async function canAccessLabCase(caseId: string) {
    const actor = await getLabActor()
    if (!actor) return false
    if (actor.isAdmin) return true

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            customerId: true,
            assignedDesignerId: true,
            offers: { select: { designerProfileId: true } },
            status: true,
        },
    })
    if (!target) return false

    if (target.customerId === actor.userId) return true
    if (target.assignedDesignerId && target.assignedDesignerId === actor.designerProfileId) return true
    if (target.offers.some((offer) => offer.designerProfileId === actor.designerProfileId)) return true

    // Open board: everyone can see the summary, but not the private files.
    return target.status === "OPEN" || target.status === "QUOTED"
}

export async function getLabCaseForViewer(id: string) {
    const target = await getLabCaseById(id)
    if (!target) return null
    const allowed = await canAccessLabCase(id)
    const actor = await getLabActor()

    const isOwner = !!actor && target.customerId === actor.userId
    const isAssignedDesigner = !!actor?.designerProfileId && target.assignedDesignerId === actor.designerProfileId

    // Public board visitors only get the summary — no files, no customer identity.
    if (!allowed) {
        return {
            ...target,
            files: [],
            customer: { id: "", publicCode: "", role: "", name: "Εμπισκευμένος" },
        }
    }
    // Files (STL scans, deliverables) stay private until the work is assigned.
    if (!isOwner && !isAssignedDesigner && !actor?.isAdmin) {
        return { ...target, files: [] }
    }
    return target
}

// ---------------------------------------------------------------- offers

export async function submitLabOffer(input: {
    caseId: string
    price: number
    leadTimeDays: number
    message?: string
}) {
    const actor = await requireActor()
    if (!actor.isDesigner || !actor.designerProfileId) {
        throw new Error("Μόνο εγγεγραμμένοι CAD designers μπορούν να κάνουν προσφορά.")
    }
    await assertLabConsents(actor.userId)

    const target = await prisma.labCase.findUnique({
        where: { id: input.caseId },
        select: { id: true, status: true, customerId: true },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")
    if (target.customerId === actor.userId) throw new Error("Δεν μπορείς να κάνεις προσφορά σε δική σου εργασία.")
    if (!["OPEN", "QUOTED"].includes(target.status)) {
        throw new Error("Η εργασία έχει ήδη ανατεθεί.")
    }

    const price = Math.round(Number(input.price))
    if (!Number.isFinite(price) || price < 1) throw new Error("Μη έγκυρη τιμή.")

    // Contact details are removed so that the deal stays on the platform.
    const message = input.message ? redactContactDetails(input.message).trim() || null : null

    await prisma.labOffer.upsert({
        where: {
            caseId_designerProfileId: {
                caseId: input.caseId,
                designerProfileId: actor.designerProfileId,
            },
        },
        update: {
            price,
            leadTimeDays: Math.max(1, Math.round(Number(input.leadTimeDays) || 3)),
            message,
            status: "PENDING",
        },
        create: {
            caseId: input.caseId,
            designerProfileId: actor.designerProfileId,
            price,
            leadTimeDays: Math.max(1, Math.round(Number(input.leadTimeDays) || 3)),
            message,
        },
    })

    await prisma.labCase.update({
        where: { id: input.caseId },
        data: { status: "QUOTED" },
    })

    revalidatePath(`/lab/cases/${input.caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true }
}

export async function acceptLabOffer(caseId: string, offerId: string) {
    const actor = await requireActor()

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, customerId: true, status: true },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new Error("Μόνο ο ιδιοκτήτης της εργασίας μπορεί να επιλέξει προσφορά.")
    }
    if (["COMPLETED", "CANCELLED"].includes(target.status)) {
        throw new Error("Η εργασία έχει ολοκληρωθεί ή ακυρωθεί.")
    }

    const offer = await prisma.labOffer.findUnique({ where: { id: offerId } })
    if (!offer || offer.caseId !== caseId) throw new Error("Η προσφορά δεν βρέθηκε.")

    const split = computeSplit(offer.price)

    await prisma.$transaction([
        prisma.labOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } }),
        prisma.labOffer.updateMany({
            where: { caseId, id: { not: offer.id } },
            data: { status: "REJECTED" },
        }),
        prisma.labCase.update({
            where: { id: caseId },
            data: {
                assignedDesignerId: offer.designerProfileId,
                agreedPrice: offer.price,
                platformFee: split.fee,
                designerPayout: split.payout,
                status: "ASSIGNED",
                paymentStatus: "UNPAID",
            },
        }),
    ])

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true, price: offer.price }
}

// ---------------------------------------------------------------- files

export async function uploadCaseFiles(
    caseId: string,
    formData: FormData,
    uploaderRole: "CUSTOMER" | "DESIGNER",
    allowedKinds: LabFileKind[]
) {
    const actor = await requireActor()

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, customerId: true, assignedDesignerId: true, status: true },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")

    const isOwner = target.customerId === actor.userId
    const isAssigned = !!actor.designerProfileId && target.assignedDesignerId === actor.designerProfileId
    if (!isOwner && !isAssigned && !actor.isAdmin) {
        throw new Error("Δεν έχεις δικαίωμα να ανεβάσεις αρχεία σε αυτή την εργασία.")
    }

    const entries = formData.getAll("files").filter((value): value is File => value instanceof File)
    const requestedKind = String(formData.get("kind") || "") as LabFileKind
    const defaultKind: LabFileKind = uploaderRole === "DESIGNER" ? "OUTPUT_STL" : "INPUT_STL"
    if (requestedKind && !allowedKinds.includes(requestedKind)) {
        throw new Error("Μη έγκυρος τύπος αρχείου.")
    }

    const uploaded: string[] = []

    for (const file of entries) {
        if (!file || file.size === 0) continue
        if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error(`Το αρχείο ${file.name} ξεπερνά τα 120MB.`)
        }
        if (!hasAcceptedExtension(file.name)) {
            throw new Error(
                `Μη υποστηριζόμενος τύπος αρχείου (${file.name}). Δεκτά: ${ACCEPTED_EXTENSIONS.join(", ")}`
            )
        }

        const kind = requestedKind || inferFileKind(file.name, defaultKind)
        if (!allowedKinds.includes(kind)) continue

        const body = Buffer.from(await file.arrayBuffer())

        // The row is created first so that the file can also be stored inside
        // the database (the fallback used on hosts with a read-only disk).
        const record = await prisma.labCaseFile.create({
            data: {
                caseId,
                kind,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || null,
                storagePath: "pending",
                storageProvider: "local",
                uploadedById: actor.userId,
                uploaderRole,
            },
        })

        try {
            const stored = await storeLabFile({
                caseId,
                fileName: file.name,
                body,
                contentType: file.type || undefined,
                fileId: record.id,
            })

            await prisma.labCaseFile.update({
                where: { id: record.id },
                data: { storagePath: stored.storagePath, storageProvider: stored.storageProvider },
            })
        } catch (error) {
            await prisma.labCaseFile.delete({ where: { id: record.id } }).catch(() => undefined)
            throw error
        }

        uploaded.push(record.id)
    }

    revalidatePath(`/lab/cases/${caseId}`)
    return { uploaded }
}

/** Customer uploads the scan + design instructions for a new case. */
export async function uploadCustomerFiles(caseId: string, formData: FormData) {
    return uploadCaseFiles(caseId, formData, "CUSTOMER", INPUT_FILE_KINDS)
}

/** Assigned designer uploads the finished files. */
export async function uploadDesignerFiles(caseId: string, formData: FormData) {
    const result = await uploadCaseFiles(caseId, formData, "DESIGNER", OUTPUT_FILE_KINDS)
    await prisma.labCase.update({
        where: { id: caseId },
        data: { status: "DELIVERED" },
    })
    revalidatePath(`/lab/cases/${caseId}`)
    return result
}

// ---------------------------------------------------------------- workflow

export async function startProduction(caseId: string) {
    const actor = await requireActor()
    if (!actor.isDesigner || !actor.designerProfileId) throw new Error("Μόνο ο designer μπορεί να ξεκινήσει την εργασία.")

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { assignedDesignerId: true, status: true },
    })
    if (!target || target.assignedDesignerId !== actor.designerProfileId) {
        throw new Error("Δεν είσαι ο designer αυτής της εργασίας.")
    }
    if (!["ASSIGNED", "IN_PRODUCTION"].includes(target.status)) {
        throw new Error("Η εργασία δεν είναι σε αναμονή.")
    }

    await prisma.labCase.update({ where: { id: caseId }, data: { status: "IN_PRODUCTION" } })
    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/designer")
    return { ok: true }
}

export async function requestRevision(caseId: string, message: string) {
    const actor = await requireActor()
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { customerId: true, assignedDesignerId: true, status: true },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new Error("Μόνο ο ιδιοκτήτης μπορεί να ζητήσει διορθώσεις.")
    }
    if (!target.assignedDesignerId) throw new Error("Η εργασία δεν έχει ανατεθεί ακόμα.")
    if (!message || message.trim().length < 3) throw new Error("Περιέγραψε τις αλλαγές που θέλεις.")

    await prisma.caseRevision.create({
        data: {
            caseId,
            designerProfileId: target.assignedDesignerId,
            requestedById: actor.userId,
            message: redactContactDetails(message).trim(),
            status: "REQUESTED",
        },
    })

    await prisma.labCase.update({ where: { id: caseId }, data: { status: "IN_PRODUCTION" } })

    revalidatePath(`/lab/cases/${caseId}`)
    return { ok: true }
}

export async function markRevisionDelivered(revisionId: string) {
    const actor = await requireActor()
    if (!actor.isDesigner || !actor.designerProfileId) throw new Error("Μόνο ο designer μπορεί να επιβεβαιώσει διόρθωση.")

    const revision = await prisma.caseRevision.findUnique({
        where: { id: revisionId },
        select: { id: true, caseId: true, designerProfileId: true, status: true },
    })
    if (!revision || revision.designerProfileId !== actor.designerProfileId) {
        throw new Error("Δεν βρέθηκε η αίτηση διόρθωσης.")
    }

    await prisma.caseRevision.update({
        where: { id: revisionId },
        data: { status: "DELIVERED" },
    })
    await prisma.labCase.update({
        where: { id: revision.caseId },
        data: { status: "DELIVERED" },
    })

    revalidatePath(`/lab/cases/${revision.caseId}`)
    return { ok: true }
}

/** Customer approves the delivered files → case completed + payout released. */
export async function approveDelivery(caseId: string) {
    const actor = await requireActor()
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            customerId: true,
            status: true,
            paymentStatus: true,
            designerPayout: true,
            assignedDesignerId: true,
        },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new Error("Μόνο ο ιδιοκτήτης μπορεί να εγκρίνει την παράδοση.")
    }
    if (!["DELIVERED", "IN_PRODUCTION"].includes(target.status)) {
        throw new Error("Η εργασία δεν είναι σε κατάσταση παράδοσης.")
    }

    const deliverables = await prisma.labCaseFile.count({
        where: { caseId, kind: { in: OUTPUT_FILE_KINDS } },
    })
    if (deliverables === 0) {
        throw new Error("Ο designer δεν έχει παραδώσει ακόμα αρχεία.")
    }

    await prisma.labCase.update({
        where: { id: caseId },
        data: { status: "COMPLETED" },
    })

    await prisma.caseRevision.updateMany({
        where: { caseId, status: { in: ["REQUESTED", "DELIVERED"] } },
        data: { status: "RESOLVED", resolvedAt: new Date() },
    })

    let released = false
    if (target.paymentStatus === "HELD") {
        released = await releaseCasePayment(caseId)
    }

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    revalidatePath("/lab/designer")
    return { ok: true, released }
}

export async function cancelLabCase(caseId: string) {
    const actor = await requireActor()
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, customerId: true, status: true, paymentStatus: true, stripePaymentIntentId: true },
    })
    if (!target) throw new Error("Η εργασία δεν βρέθηκε.")
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new Error("Μόνο ο ιδιοκτήτης μπορεί να ακυρώσει την εργασία.")
    }
    if (target.status === "COMPLETED") throw new Error("Η εργασία έχει ολοκληρωθεί.")

    await prisma.labCase.update({
        where: { id: caseId },
        data: { status: "CANCELLED" },
    })

    if (target.paymentStatus === "HELD" && target.stripePaymentIntentId) {
        try {
            await stripe.refunds.create({ payment_intent: target.stripePaymentIntentId })
            await prisma.labCase.update({
                where: { id: caseId },
                data: { paymentStatus: "REFUNDED" },
            })
        } catch (error) {
            console.error("[lab] Refund failed:", error)
        }
    }

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true }
}

// ---------------------------------------------------------------- payments

/** Creates the PaymentIntent for the agreed price (escrow on the platform). */
export async function createCasePaymentIntent(
    caseId: string
): Promise<
    | { clientSecret: string; id: string; amountCents: number; feeCents: number; payoutCents: number }
    | { error: string }
> {
    const session = await auth()
    if (!session?.user?.id) return { error: "Πρέπει να είσαι συνδεδεμένος για να πληρώσεις." }

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            code: true,
            customerId: true,
            agreedPrice: true,
            platformFee: true,
            designerPayout: true,
            paymentStatus: true,
            assignedDesignerId: true,
            assignedDesigner: { select: { stripeAccountId: true, user: { select: { name: true } } } },
        },
    })
    if (!target) return { error: "Η εργασία δεν βρέθηκε." }
    if (target.customerId !== session.user.id) {
        return { error: "Μόνο ο ιδιοκτήτης μπορεί να πληρώσει." }
    }
    if (!target.agreedPrice || !target.assignedDesignerId) {
        return { error: "Δεν έχει επιλεγεί προσφορά για αυτή την εργασία." }
    }
    if (target.paymentStatus === "HELD") return { error: "Η εργασία έχει ήδη πληρωθεί." }
    if (target.paymentStatus === "RELEASED") {
        return { error: "Η πληρωμή έχει ήδη αποδεσμευτεί στον designer." }
    }

    const split = computeSplit(target.agreedPrice)
    const amount = Math.round(target.agreedPrice * 100)

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "eur",
            automatic_payment_methods: { enabled: true },
            metadata: {
                labCaseId: target.id,
                customerId: target.customerId,
                designerProfileId: target.assignedDesignerId,
                feeCents: String(Math.round(split.fee * 100)),
                payoutCents: String(Math.round(split.payout * 100)),
            },
        })

        await prisma.labCase.update({
            where: { id: caseId },
            data: {
                stripePaymentIntentId: paymentIntent.id,
                platformFee: split.fee,
                designerPayout: split.payout,
            },
        })

        return {
            clientSecret: paymentIntent.client_secret as string,
            id: paymentIntent.id,
            amountCents: amount,
            feeCents: Math.round(split.fee * 100),
            payoutCents: Math.round(split.payout * 100),
        }
    } catch (error: any) {
        console.error("[lab] Payment intent error:", error)
        return { error: error?.message || "Η δημιουργία της πληρωμής απέτυχε." }
    }
}

/** Moves the held money to the designer's connected Stripe account. */
export async function releaseCasePayment(caseId: string) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            paymentStatus: true,
            designerPayout: true,
            platformFee: true,
            agreedPrice: true,
            assignedDesignerId: true,
            assignedDesigner: { select: { stripeAccountId: true, user: { select: { name: true } } } },
        },
    })
    if (!target) return false
    if (target.paymentStatus === "RELEASED") return true
    if (!target.designerPayout || !target.assignedDesigner) return false

    const accountId = target.assignedDesigner.stripeAccountId
    if (!accountId) {
        console.warn(`[lab] Designer ${target.assignedDesignerId} has no Stripe account — payout pending.`)
        return false
    }

    const payoutCents = Math.round(target.designerPayout * 100)
    if (payoutCents <= 0) return false

    const transfer = await stripe.transfers.create({
        amount: payoutCents,
        currency: "eur",
        destination: accountId,
        metadata: { labCaseId: target.id },
    })

    await prisma.labCase.update({
        where: { id: target.id },
        data: { paymentStatus: "RELEASED", stripeTransferId: transfer.id },
    })

    if (target.assignedDesignerId) {
        const designer = await prisma.designerProfile.findUnique({
            where: { id: target.assignedDesignerId },
            select: { earnings: true, completedCases: true },
        })
        if (designer) {
            await prisma.designerProfile.update({
                where: { id: target.assignedDesignerId },
                data: {
                    earnings: designer.earnings + target.designerPayout,
                    completedCases: designer.completedCases + 1,
                },
            })
        }
    }

    return true
}

/** Called from the Stripe webhook once the money is captured. */
export async function markCasePaymentHeld(caseId: string, paymentIntentId: string) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, paymentStatus: true },
    })
    if (!target) return
    if (target.paymentStatus === "RELEASED") return

    await prisma.labCase.update({
        where: { id: caseId },
        data: { paymentStatus: "HELD", stripePaymentIntentId: paymentIntentId },
    })
}

export async function getLabPaymentConfig() {
    return { feeRate: LAB_PLATFORM_FEE_RATE }
}
