"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
    computeSplit,
    generateCaseCode,
    inferFileKind,
    INPUT_FILE_KINDS,
    LAB_PLATFORM_FEE_RATE,
    OUTPUT_FILE_KINDS,
    redactContactDetails,
    type LabFileKind,
} from "@/lib/lab"
import {
    ACCEPTED_EXTENSIONS,
    hasAcceptedExtension,
    MAX_UPLOAD_BYTES,
    storeLabFile,
} from "@/lib/lab-storage"
import {
    getLabActor,
    LabActionError,
    requireLabActor,
    type LabActor,
} from "@/lib/lab-domain"
import {
    createCasePaymentIntentInternal,
    getLabWebhookSecret,
    refundCasePaymentInternal,
    releaseCasePaymentInternal,
} from "@/lib/lab-payments"
import { stripe } from "@/lib/stripe"

// The actor and the consent checks live in a server-only module: the "use
// server" directive turns every export of this file into a public POST
// endpoint.
export { getLabActor }
export type { LabActor }

async function requireActor(): Promise<LabActor> {
    return requireLabActor()
}

async function assertLabConsents(userId: string) {
    const { assertLabConsents: assert } = await import("@/lib/lab-domain")
    return assert(userId)
}

// ---------------------------------------------------------------- cases

export async function createLabCase(formData: FormData) {
    const actor = await requireActor()
    if (!actor.isCustomer && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο οδοντίατρες και εργαστήρια μπορούν να δημιουργήσουν εργασία.",
            403
        )
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
    const clientRequestId = String(formData.get("clientRequestId") || "").trim() || null

    if (!type || !material || !description) {
        throw new LabActionError("VALIDATION", "Συμπλήρωσε είδος, υλικό και περιγραφή.")
    }

    const deadline = deadlineRaw ? new Date(deadlineRaw) : null

    // A retried upload must not create a second work.
    if (clientRequestId) {
        const existing = await prisma.labCase.findUnique({
            where: { clientRequestId },
            select: { id: true, code: true },
        })
        if (existing) {
            return { id: existing.id, code: existing.code, reused: true }
        }
    }

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
            ...(clientRequestId ? { clientRequestId } : {}),
        },
    })

    // The customer may address the work to a specific designer. That is only a
    // request with a proposed price: the designer still has to answer before
    // the work is assigned and the price is agreed.
    if (designerId) {
        const designer = await prisma.designerProfile.findUnique({
            where: { id: designerId },
            include: { services: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
        })
        if (!designer) {
            throw new LabActionError("NOT_FOUND", "Ο designer δεν βρέθηκε.", 404)
        }

        const suggestedPrice = designer.services[0]?.price ?? null
        if (suggestedPrice) {
            await prisma.labOffer.upsert({
                where: {
                    caseId_designerProfileId: { caseId: created.id, designerProfileId: designer.id },
                },
                update: { status: "PENDING", source: "CUSTOMER_REQUEST", price: suggestedPrice },
                create: {
                    caseId: created.id,
                    designerProfileId: designer.id,
                    price: suggestedPrice,
                    leadTimeDays: designer.services[0]?.leadTimeDays ?? 3,
                    message: "Απευθύνεται σε συγκεκριμένο designer.",
                    source: "CUSTOMER_REQUEST",
                    status: "PENDING",
                },
            })
        }

        await prisma.labCase.update({
            where: { id: created.id },
            data: { requestedDesignerId: designer.id },
        })
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

// ---------------------------------------------------------------- offers

type LabOfferInput = {
    caseId: string
    price: number
    leadTimeDays: number
    message?: string
}

export async function submitLabOffer(input: LabOfferInput): Promise<
    { ok: true } | { ok: false; code: string; message: string }
> {
    try {
        await saveLabOffer(input)
        return { ok: true }
    } catch (error) {
        if (error instanceof LabActionError) {
            return { ok: false, code: error.code, message: error.message }
        }
        console.error("[lab] Could not submit an offer:", error)
        return { ok: false, code: "UNAVAILABLE", message: "Η προσφορά δεν μπόρεσε να καταχωριστεί. Δοκίμασε ξανά." }
    }
}

async function saveLabOffer(input: LabOfferInput) {
    const actor = await requireActor()
    if (!actor.isDesigner || !actor.designerProfileId) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο εγγεγραμμένοι CAD designers μπορούν να κάνουν προσφορά.",
            403
        )
    }
    await assertLabConsents(actor.userId)

    const target = await prisma.labCase.findUnique({
        where: { id: input.caseId },
        select: {
            id: true,
            status: true,
            customerId: true,
            assignedDesignerId: true,
            requestedDesignerId: true,
        },
    })
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)
    if (target.customerId === actor.userId) {
        throw new LabActionError("FORBIDDEN", "Δεν μπορείς να κάνεις προσφορά σε δική σου εργασία.", 403)
    }
    if (target.assignedDesignerId && target.assignedDesignerId !== actor.designerProfileId) {
        throw new LabActionError(
            "CASE_ASSIGNED",
            "Η εργασία έχει ήδη ανατεθεί σε άλλον designer.",
            409
        )
    }
    if (!["OPEN", "QUOTED"].includes(target.status)) {
        throw new LabActionError(
            "CASE_NOT_OPEN",
            "Η εργασία έχει ήδη ανατεθεί ή ολοκληρωθεί.",
            409
        )
    }
    if (
        target.requestedDesignerId &&
        target.requestedDesignerId !== actor.designerProfileId
    ) {
        throw new LabActionError(
            "CASE_ADDRESSED",
            "Η εργασία απευθύνεται σε συγκεκριμένο designer.",
            409
        )
    }

    const price = Math.round(Number(input.price))
    if (!Number.isFinite(price) || price < 1) {
        throw new LabActionError("VALIDATION", "Μη έγκυρη τιμή.")
    }
    if (price > 100000) {
        throw new LabActionError("VALIDATION", "Η τιμή είναι υπερβολική.")
    }

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
            source: "DESIGNER",
        },
        create: {
            caseId: input.caseId,
            designerProfileId: actor.designerProfileId,
            price,
            leadTimeDays: Math.max(1, Math.round(Number(input.leadTimeDays) || 3)),
            message,
        },
    })

    // The work now has at least one price on the table. The status is only
    // changed when the work is still open, so an accepted offer can never be
    // reset by a late offer.
    await prisma.labCase.updateMany({
        where: { id: input.caseId, status: "OPEN" },
        data: { status: "QUOTED" },
    })

    revalidatePath(`/lab/cases/${input.caseId}`)
    revalidatePath("/lab/cases")
    revalidatePath("/lab/designer")
}

/**
 * Accepts an offer: the offer becomes the agreement of the work.
 *
 * The state change is conditional, so two clicks (or two parallel requests)
 * cannot accept two different offers: the second one finds the work already
 * assigned and is rejected.
 */
export async function acceptLabOffer(caseId: string, offerId: string) {
    const actor = await requireActor()

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, customerId: true, status: true, paymentStatus: true },
    })
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο ο ιδιοκτήτης της εργασίας μπορεί να επιλέξει προσφορά.",
            403
        )
    }
    if (!["OPEN", "QUOTED"].includes(target.status)) {
        throw new LabActionError(
            "CASE_NOT_OPEN",
            "Η εργασία έχει ήδη ανατεθεί, ολοκληρωθεί ή ακυρωθεί.",
            409
        )
    }

    const offer = await prisma.labOffer.findUnique({ where: { id: offerId } })
    if (!offer || offer.caseId !== caseId) {
        throw new LabActionError("NOT_FOUND", "Η προσφορά δεν βρέθηκε.", 404)
    }
    if (offer.status !== "PENDING") {
        throw new LabActionError(
            "OFFER_NOT_PENDING",
            "Η προσφορά έχει ήδη διευθετηθεί.",
            409
        )
    }

    const split = computeSplit(offer.price)

    // Only one offer can win: the conditional update decides the race.
    const assigned = await prisma.labCase.updateMany({
        where: { id: caseId, status: { in: ["OPEN", "QUOTED"] } },
        data: {
            assignedDesignerId: offer.designerProfileId,
            agreedPrice: offer.price,
            platformFee: split.fee,
            designerPayout: split.payout,
            status: "ASSIGNED",
        },
    })

    if (assigned.count !== 1) {
        throw new LabActionError(
            "CASE_ALREADY_ASSIGNED",
            "Η εργασία έχει ήδη ανατεθεί σε άλλον designer.",
            409
        )
    }

    await prisma.$transaction([
        prisma.labOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } }),
        prisma.labOffer.updateMany({
            where: { caseId, id: { not: offer.id }, status: "PENDING" },
            data: { status: "REJECTED" },
        }),
    ])

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true, price: offer.price }
}

/** Rejects an offer (by the customer or by the designer of that offer). */
export async function rejectLabOffer(caseId: string, offerId: string) {
    const actor = await requireActor()

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, customerId: true, status: true },
    })
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)

    const offer = await prisma.labOffer.findUnique({ where: { id: offerId } })
    if (!offer || offer.caseId !== caseId) {
        throw new LabActionError("NOT_FOUND", "Η προσφορά δεν βρέθηκε.", 404)
    }

    const isOwner = target.customerId === actor.userId
    const isOfferDesigner = offer.designerProfileId === actor.designerProfileId
    if (!isOwner && !isOfferDesigner && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Δεν έχεις δικαίωμα να απορρίψεις αυτή την προσφορά.",
            403
        )
    }
    if (offer.status === "ACCEPTED") {
        throw new LabActionError("OFFER_ACCEPTED", "Η προσφορά έχει ήδη γίνει αποδεκτή.", 409)
    }

    await prisma.labOffer.update({ where: { id: offer.id }, data: { status: "REJECTED" } })

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true }
}

// ---------------------------------------------------------------- files

async function uploadCaseFiles(
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
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)

    const isOwner = target.customerId === actor.userId
    const isAssigned = !!actor.designerProfileId && target.assignedDesignerId === actor.designerProfileId
    if (!isOwner && !isAssigned && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Δεν έχεις δικαίωμα να ανεβάσεις αρχεία σε αυτή την εργασία.",
            403
        )
    }

    // The uploader role and the allowed file kinds are derived from the
    // session and the case, never from the request. A client cannot claim to
    // be the designer and deliver files to a work that is not assigned to
    // them.
    const isDesignerUpload = uploaderRole === "DESIGNER"
    if (isDesignerUpload && !isAssigned && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο ο designer στον οποίο έχει ανατεθεί η εργασία μπορεί να παραδώσει αρχεία.",
            403
        )
    }
    if (isDesignerUpload && !["ASSIGNED", "IN_PRODUCTION"].includes(target.status)) {
        throw new LabActionError(
            "CASE_NOT_IN_PRODUCTION",
            "Η εργασία δεν είναι σε κατάσταση παράδοσης.",
            409
        )
    }

    const entries = formData.getAll("files").filter((value): value is File => value instanceof File)
    const requestedKind = String(formData.get("kind") || "") as LabFileKind
    const defaultKind: LabFileKind = isDesignerUpload ? "OUTPUT_STL" : "INPUT_STL"
    if (requestedKind && !allowedKinds.includes(requestedKind)) {
        throw new LabActionError("VALIDATION", "Μη έγκυρος τύπος αρχείου.")
    }

    const uploaded: string[] = []
    const failed: { name: string; reason: string }[] = []

    for (const file of entries) {
        if (!file || file.size === 0) continue
        if (file.size > MAX_UPLOAD_BYTES) {
            throw new LabActionError(
                "FILE_TOO_LARGE",
                `Το αρχείο ${file.name} ξεπερνά τα ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`
            )
        }
        if (!hasAcceptedExtension(file.name)) {
            throw new LabActionError(
                "UNSUPPORTED_FILE",
                `Μη υποστηριζόμενος τύπος αρχείου (${file.name}). Δεκτά: ${ACCEPTED_EXTENSIONS.join(", ")}`
            )
        }

        const kind = requestedKind || inferFileKind(file.name, defaultKind)
        if (!allowedKinds.includes(kind)) {
            failed.push({
                name: file.name,
                reason: "Ο τύπος αρχείου δεν επιτρέπεται για αυτόν τον ρόλο.",
            })
            continue
        }

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
            // The row is removed again: a file that could not be stored must
            // not appear as an upload.
            await prisma.labCaseFile.delete({ where: { id: record.id } }).catch(() => undefined)
            failed.push({
                name: file.name,
                reason: error instanceof Error ? error.message : "Η αποθήκευση απέτυχε.",
            })
            continue
        }

        uploaded.push(record.id)
    }

    revalidatePath(`/lab/cases/${caseId}`)
    return { uploaded, failed }
}

/** Customer uploads the scan + design instructions for a new case. */
export async function uploadCustomerFiles(caseId: string, formData: FormData) {
    return uploadCaseFiles(caseId, formData, "CUSTOMER", INPUT_FILE_KINDS)
}

/** The assigned designer stores draft deliverables. */
export async function uploadDesignerFiles(caseId: string, formData: FormData) {
    const actor = await requireActor()
    if (!actor.isDesigner || !actor.designerProfileId) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο ο designer μπορεί να παραδώσει αρχεία.",
            403
        )
    }

    const result = await uploadCaseFiles(caseId, formData, "DESIGNER", OUTPUT_FILE_KINDS)

    if (result.uploaded.length === 0) {
        throw new LabActionError(
            "NO_FILE_STORED",
            "Δεν αποθηκεύτηκε κανένα αρχείο. Η εργασία παραμένει σε εξέλιξη.",
            409
        )
    }

    return result
}

export async function submitLabDelivery(caseId: string) {
    const actor = await getLabActor()
    if (!actor?.isDesigner || !actor.designerProfileId) {
        return { error: "Μόνο ο designer της εργασίας μπορεί να υποβάλει παράδοση." }
    }
    const result = await prisma.$transaction(async (tx) => {
        const submittedAt = new Date()
        const drafts = {
            caseId,
            uploadedById: actor.userId,
            uploaderRole: "DESIGNER",
            kind: { in: OUTPUT_FILE_KINDS },
            storagePath: { not: "pending" },
            fileSize: { gt: 0 },
            submittedAt: null,
        }
        const updated = await tx.labCase.updateMany({
            where: {
                id: caseId,
                assignedDesignerId: actor.designerProfileId,
                status: { in: ["ASSIGNED", "IN_PRODUCTION"] },
                paymentStatus: "HELD",
                files: { some: drafts },
            },
            data: { status: "DELIVERED" },
        })
        if (!updated.count) {
            return { error: "Η παράδοση χρειάζεται επιβεβαιωμένη πληρωμή και τουλάχιστον ένα νέο αποθηκευμένο παραδοτέο." }
        }
        await tx.labCaseFile.updateMany({ where: drafts, data: { submittedAt } })
        await tx.caseRevision.updateMany({
            where: { caseId, status: "REQUESTED" },
            data: { status: "DELIVERED" },
        })
        return { ok: true }
    })
    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/designer")
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

    await prisma.labCase.updateMany({
        where: {
            id: caseId,
            assignedDesignerId: actor.designerProfileId,
            status: { in: ["ASSIGNED", "IN_PRODUCTION"] },
            paymentStatus: "HELD",
        },
        data: { status: "IN_PRODUCTION" },
    })
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

    const designerProfileId = target.assignedDesignerId
    await prisma.$transaction(async (tx) => {
        const updated = await tx.labCase.updateMany({
            where: { id: caseId, status: "DELIVERED" },
            data: { status: "IN_PRODUCTION" },
        })
        if (!updated.count) throw new LabActionError("CASE_NOT_DELIVERED", "Η εργασία δεν είναι σε κατάσταση παράδοσης.", 409)
        await tx.caseRevision.create({
            data: {
                caseId,
                designerProfileId,
                requestedById: actor.userId,
                message: redactContactDetails(message).trim(),
                status: "REQUESTED",
            },
        })
    })

    revalidatePath(`/lab/cases/${caseId}`)
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
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο ο ιδιοκτήτης μπορεί να εγκρίνει την παράδοση.",
            403
        )
    }
    if (target.status !== "DELIVERED") {
        throw new LabActionError(
            "CASE_NOT_DELIVERED",
            "Η εργασία δεν είναι σε κατάσταση παράδοσης.",
            409
        )
    }

    const completed = await prisma.$transaction(async (tx) => {
        const updated = await tx.labCase.updateMany({
            where: {
                id: caseId,
                status: "DELIVERED",
                files: { some: { kind: { in: OUTPUT_FILE_KINDS }, submittedAt: { not: null } } },
            },
            data: { status: "COMPLETED" },
        })
        if (!updated.count) return false
        await tx.caseRevision.updateMany({
            where: { caseId, status: { in: ["REQUESTED", "DELIVERED"] } },
            data: { status: "RESOLVED", resolvedAt: new Date() },
        })
        return true
    })
    if (!completed) throw new LabActionError("CASE_CHANGED", "Δεν υπάρχει διαθέσιμη παράδοση για έγκριση.", 409)

    // The money is released only when it is really held. If the designer has
    // no Stripe account yet the payout stays pending and can be retried.
    let released = false
    if (target.paymentStatus === "HELD") {
        try {
            const result = await releaseCasePaymentInternal(caseId)
            released = result.released
            if (!released && result.reason === "designer_without_account") {
                console.warn(
                    `[lab] Case ${caseId}: the designer has no Stripe account yet, the payout stays pending.`
                )
            }
        } catch (error) {
            console.error("[lab] Payout failed:", error)
        }
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
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)
    if (target.customerId !== actor.userId && !actor.isAdmin) {
        throw new LabActionError(
            "FORBIDDEN",
            "Μόνο ο ιδιοκτήτης μπορεί να ακυρώσει την εργασία.",
            403
        )
    }
    if (target.status === "COMPLETED") {
        throw new LabActionError("CASE_COMPLETED", "Η εργασία έχει ολοκληρωθεί.", 409)
    }

    if (target.stripePaymentIntentId && ["UNPAID", "FAILED"].includes(target.paymentStatus) && target.status !== "CANCELLED") {
        // Prevent a checkout left open in another tab from charging after cancellation.
        try {
            const intent = await stripe.paymentIntents.retrieve(target.stripePaymentIntentId)
            if (intent.status !== "canceled") await stripe.paymentIntents.cancel(intent.id)
        } catch (error) {
            console.error("[lab] Could not cancel the open Lab payment:", error)
            throw new LabActionError(
                "PAYMENT_NOT_CANCELLED",
                "Η πληρωμή δεν μπορεί να ακυρωθεί αυτή τη στιγμή. Ανανέωσε τη σελίδα και δοκίμασε ξανά.",
                409
            )
        }
    }

    if (target.status !== "CANCELLED") {
        const cancelled = await prisma.labCase.updateMany({
            where: {
                id: caseId,
                status: target.status,
                stripePaymentIntentId: target.stripePaymentIntentId,
                paymentStatus: { not: "RELEASED" },
            },
            data: { status: "CANCELLED" },
        })
        if (!cancelled.count) throw new LabActionError("CASE_CHANGED", "Η κατάσταση της εργασίας άλλαξε. Ανανέωσε τη σελίδα.", 409)
    }

    let refunded = false
    try {
        refunded = (await refundCasePaymentInternal(caseId)).refunded
    } catch (error) {
        console.error("[lab] Refund remains pending:", error)
    }

    revalidatePath(`/lab/cases/${caseId}`)
    revalidatePath("/lab/cases")
    return { ok: true, refunded }
}

// ---------------------------------------------------------------- payments

/**
 * Creates the PaymentIntent for the agreed price (escrow on the platform).
 * The amount is always derived from the accepted offer on the server and the
 * Stripe call uses an idempotency key, so a double click cannot create two
 * payable intents for the same work.
 */
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
        select: { id: true, customerId: true },
    })
    if (!target) return { error: "Η εργασία δεν βρέθηκε." }
    if (target.customerId !== session.user.id) {
        return { error: "Μόνο ο ιδιοκτήτης μπορεί να πληρώσει." }
    }
    if (!getLabWebhookSecret()) {
        return { error: "Οι πληρωμές Lab δεν είναι διαθέσιμες αυτή τη στιγμή. Δοκίμασε αργότερα." }
    }

    try {
        return await createCasePaymentIntentInternal(caseId)
    } catch (error: unknown) {
        if (error instanceof LabActionError) return { error: error.message }
        console.error("[lab] Payment intent error:", error)
        return { error: "Η δημιουργία της πληρωμής απέτυχε. Δοκίμασε ξανά." }
    }
}

/**
 * Releases the escrowed money of a completed case.
 *
 * This action only exists for the customer of the case (and the admins) and
 * it can only release a payment that is really held. The money transfer
 * itself lives in a server-only module.
 */
export async function releaseCasePayment(caseId: string) {
    const actor = await getLabActor()

    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { customerId: true, assignedDesignerId: true, status: true, paymentStatus: true },
    })
    if (!actor || !target || !(actor.isAdmin || target.customerId === actor.userId ||
        (actor.isDesigner && actor.designerProfileId === target.assignedDesignerId))) {
        return { error: "Δεν έχεις δικαίωμα αποδέσμευσης για αυτή την εργασία." }
    }
    if (target.status !== "COMPLETED" || !["HELD", "RELEASED"].includes(target.paymentStatus)) {
        return { error: "Δεν υπάρχει διαθέσιμη πληρωμή για αποδέσμευση." }
    }
    try {
        const result = await releaseCasePaymentInternal(caseId)
        if (result.released) {
            revalidatePath(`/lab/cases/${caseId}`)
            revalidatePath("/lab/designer")
            return { ok: true }
        }
        if (result.reason === "designer_without_account") {
            return { error: "Ο designer πρέπει πρώτα να συνδέσει το Stripe." }
        }
        if (result.reason === "missing_charge" || result.reason === "reconciliation_required") {
            return { error: "Η πληρωμή χρειάζεται έλεγχο από την υποστήριξη της Dentora." }
        }
    } catch (error) {
        console.error("[lab] Payout retry failed:", error)
    }
    return { error: "Η αποδέσμευση εκκρεμεί. Δοκίμασε ξανά σε λίγο." }
}

export async function getLabPaymentConfig() {
    return { feeRate: LAB_PLATFORM_FEE_RATE }
}
