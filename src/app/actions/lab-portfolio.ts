"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getLabActor, LabActionError } from "@/lib/lab-domain"
import {
    getOwnPortfolioOwner,
    PORTFOLIO_CATEGORIES,
    type PortfolioOwnerType,
} from "@/lib/lab-portfolio"
import { deleteLabFile } from "@/lib/lab-storage"

// Portfolio of the designers and the labs.
//
// The pictures are public work samples and are completely separate from the
// private case files. Every change checks the ownership on the server.

async function requireOwner(ownerType: PortfolioOwnerType) {
    const actor = await getLabActor()
    if (!actor) {
        throw new LabActionError("UNAUTHENTICATED", "Πρέπει να είσαι συνδεδεμένος.", 401)
    }

    const owner = await getOwnPortfolioOwner(ownerType)
    if (!owner) {
        throw new LabActionError(
            "FORBIDDEN",
            ownerType === "DESIGNER"
                ? "Μόνο οι CAD designers μπορούν να διαχειρίζονται το portfolio τους."
                : "Μόνο τα οδοντοτεχνικά εργαστήρια μπορούν να διαχειρίζονται το portfolio τους.",
            403
        )
    }

    return { actor, owner }
}

/**
 * Checks that the signed in user owns the portfolio item. The owner is read
 * from the profile of the user, never from the request.
 */
async function requireItemOwner(item: {
    ownerType: string
    designerProfileId: string | null
    labProfileId: string | null
}) {
    const actor = await getLabActor()
    if (!actor) {
        throw new LabActionError("UNAUTHENTICATED", "Πρέπει να είσαι συνδεδεμένος.", 401)
    }

    if (item.ownerType === "DESIGNER") {
        if (!actor.designerProfileId || actor.designerProfileId !== item.designerProfileId) {
            throw new LabActionError(
                "FORBIDDEN",
                "Αυτή η εικόνα δεν ανήκει στο portfolio σου.",
                403
            )
        }
        return actor
    }

    if (item.ownerType === "LAB") {
        const lab = await prisma.labProfile.findFirst({
            where: { id: item.labProfileId ?? "", userId: actor.userId },
            select: { id: true },
        })
        if (!lab) {
            throw new LabActionError(
                "FORBIDDEN",
                "Αυτή η εικόνα δεν ανήκει στο portfolio σου.",
                403
            )
        }
        return actor
    }

    throw new LabActionError("FORBIDDEN", "Αυτή η εικόνα δεν ανήκει στο portfolio σου.", 403)
}

export async function listOwnPortfolio(ownerType: PortfolioOwnerType) {
    // The list only contains the items of the signed in owner.
    const { owner } = await requireOwner(ownerType)
    return prisma.portfolioItem.findMany({
        where:
            ownerType === "DESIGNER"
                ? { ownerType: "DESIGNER", designerProfileId: owner.id }
                : { ownerType: "LAB", labProfileId: owner.id },
        orderBy: [{ isCover: "desc" }, { position: "asc" }, { createdAt: "asc" }],
        select: {
            id: true,
            title: true,
            description: true,
            category: true,
            mimeType: true,
            width: true,
            height: true,
            isCover: true,
            position: true,
        },
    })
}

/** Updates the texts of a portfolio item. */
export async function updatePortfolioItem(input: {
    id: string
    title?: string
    description?: string
    category?: string
}) {
    const title = input.title?.trim() ?? ""
    if (!title || title.length > 120) {
        throw new LabActionError("VALIDATION", "Βάλε έναν τίτλο (έως 120 χαρακτήρες).")
    }
    const description = input.description?.trim() ?? ""
    if (description.length > 600) {
        throw new LabActionError("VALIDATION", "Η περιγραφή είναι πολύ μεγάλη (έως 600 χαρακτήρες).")
    }
    const category = (input.category ?? "").trim()
    if (category && !PORTFOLIO_CATEGORIES.includes(category as any)) {
        throw new LabActionError("VALIDATION", "Άγνωστη κατηγορία.")
    }

    const item = await prisma.portfolioItem.findUnique({
        where: { id: input.id },
        select: { id: true, ownerType: true, designerProfileId: true, labProfileId: true },
    })
    if (!item) throw new LabActionError("NOT_FOUND", "Η εικόνα δεν βρέθηκε.", 404)

    await requireItemOwner(item)

    await prisma.portfolioItem.update({
        where: { id: item.id },
        data: { title, description: description || null, category },
    })

    revalidatePath("/lab/designer/profile")
    revalidatePath("/lab/designers")
    return { ok: true }
}

/** Deletes a portfolio item and the stored file. */
export async function deletePortfolioItem(id: string) {
    const item = await prisma.portfolioItem.findUnique({
        where: { id },
        select: {
            id: true,
            ownerType: true,
            designerProfileId: true,
            labProfileId: true,
            storagePath: true,
            storageProvider: true,
        },
    })
    if (!item) throw new LabActionError("NOT_FOUND", "Η εικόνα δεν βρέθηκε.", 404)

    await requireItemOwner(item)

    await deleteLabFile(item.storagePath, item.storageProvider as any)
    await prisma.portfolioItem.delete({ where: { id: item.id } })

    revalidatePath("/lab/designer/profile")
    revalidatePath("/lab/designers")
    return { ok: true }
}

/** Sets the cover image of the portfolio (only one at a time). */
export async function setPortfolioCover(id: string) {
    const item = await prisma.portfolioItem.findUnique({
        where: { id },
        select: { id: true, ownerType: true, designerProfileId: true, labProfileId: true },
    })
    if (!item) throw new LabActionError("NOT_FOUND", "Η εικόνα δεν βρέθηκε.", 404)

    await requireItemOwner(item)

    await prisma.$transaction([
        prisma.portfolioItem.updateMany({
            where:
                item.ownerType === "DESIGNER"
                    ? { ownerType: "DESIGNER", designerProfileId: item.designerProfileId }
                    : { ownerType: "LAB", labProfileId: item.labProfileId },
            data: { isCover: false },
        }),
        prisma.portfolioItem.update({ where: { id: item.id }, data: { isCover: true } }),
    ])

    revalidatePath("/lab/designer/profile")
    revalidatePath("/lab/designers")
    return { ok: true }
}

/**
 * Saves the new order of the portfolio. Only the items of the owner are
 * touched, the order of the others cannot be changed.
 */
export async function reorderPortfolioItems(input: {
    ownerType: PortfolioOwnerType
    ids: string[]
}) {
    const { owner } = await requireOwner(input.ownerType)

    const ids = input.ids.filter((id) => typeof id === "string" && id.length > 0)
    if (ids.length === 0) return { ok: true }

    const where =
        input.ownerType === "DESIGNER"
            ? { ownerType: "DESIGNER", designerProfileId: owner.id, id: { in: ids } }
            : { ownerType: "LAB", labProfileId: owner.id, id: { in: ids } }

    const items = await prisma.portfolioItem.findMany({ where, select: { id: true } })
    const owned = new Set(items.map((item) => item.id))

    await prisma.$transaction(
        ids
            .filter((id) => owned.has(id))
            .map((id, index) =>
                prisma.portfolioItem.update({ where: { id }, data: { position: index } })
            )
    )

    revalidatePath("/lab/designer/profile")
    revalidatePath("/lab/designers")
    return { ok: true }
}
