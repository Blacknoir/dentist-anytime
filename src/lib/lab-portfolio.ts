// Server-only logic of the portfolio (public work samples of designers and
// labs).
//
// The portfolio is completely separate from the case files: a portfolio
// picture is public, a case file is private and encrypted. The images are
// checked on the server (real file type, size and dimensions), never only on
// the client.

import "server-only"

import { prisma } from "@/lib/prisma"
import { encryptBuffer, decryptBuffer, isEncryptedPayload } from "@/lib/lab-crypto"
import { isBlobConfigured } from "@/lib/lab-storage"
import { LabActionError } from "@/lib/lab-domain"

export const MAX_PORTFOLIO_IMAGE_BYTES = 8 * 1024 * 1024
export const MIN_PORTFOLIO_DIMENSION = 320
export const MAX_PORTFOLIO_DIMENSION = 6000

export const PORTFOLIO_CATEGORIES = [
    "Κορώνες",
    "Εμφύτεμα",
    "Προσθετικά",
    "Ορθοδοντικά",
    "Χειροτεχνία",
    "Άλλο",
] as const

export type PortfolioOwnerType = "DESIGNER" | "LAB"

const IMAGE_TYPES: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
}

/**
 * Reads the real type of the file from its magic bytes. The mime type of the
 * browser is not trusted.
 */
export function sniffImageType(buffer: Buffer): { contentType: string; extension: string } | null {
    if (buffer.length < 12) return null

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { contentType: IMAGE_TYPES.jpeg, extension: "jpg" }
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return { contentType: IMAGE_TYPES.png, extension: "png" }
    }

    // WebP: "RIFF" .... "WEBP"
    if (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return { contentType: IMAGE_TYPES.webp, extension: "webp" }
    }

    return null
}

/** Reads the dimensions of a JPEG or PNG image from its header. */
export function readImageDimensions(
    buffer: Buffer,
    contentType: string
): { width: number; height: number } | null {
    try {
        if (contentType === "image/png") {
            if (buffer.length < 24) return null
            // 8 bytes signature + 4 bytes length + "IHDR" + width + height
            const width = buffer.readUInt32BE(16)
            const height = buffer.readUInt32BE(20)
            return { width, height }
        }

        if (contentType === "image/jpeg") {
            let offset = 2
            while (offset + 9 < buffer.length) {
                if (buffer[offset] !== 0xff) {
                    offset++
                    continue
                }
                const marker = buffer[offset + 1]
                // Start of frame (the markers that carry the dimensions).
                if (
                    marker >= 0xc0 &&
                    marker <= 0xcf &&
                    marker !== 0xc4 &&
                    marker !== 0xc8 &&
                    marker !== 0xcc
                ) {
                    const height = buffer.readUInt16BE(offset + 5)
                    const width = buffer.readUInt16BE(offset + 7)
                    if (width > 0 && height > 0) return { width, height }
                }
                // Stand alone markers (without a payload).
                if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
                    offset += 2
                    continue
                }
                if (offset + 4 > buffer.length) break
                const length = buffer.readUInt16BE(offset + 2)
                if (length < 2) {
                    offset += 2
                    continue
                }
                offset += 2 + length
            }
        }
    } catch {
        return null
    }

    return null
}

/**
 * Checks a portfolio image: real type, size and dimensions. The client may
 * send anything, so everything is verified again here.
 */
export function validatePortfolioImage(buffer: Buffer) {
    if (!buffer || buffer.length === 0) {
        throw new LabActionError("VALIDATION", "Η εικόνα είναι κενή.")
    }
    if (buffer.length > MAX_PORTFOLIO_IMAGE_BYTES) {
        throw new LabActionError(
            "FILE_TOO_LARGE",
            `Η εικόνα ξεπερνά τα ${Math.round(MAX_PORTFOLIO_IMAGE_BYTES / (1024 * 1024))}MB.`
        )
    }

    const sniffed = sniffImageType(buffer)
    if (!sniffed) {
        throw new LabActionError(
            "INVALID_IMAGE",
            "Το αρχείο δεν είναι έγκυρη εικόνα (JPEG, PNG ή WebP)."
        )
    }

    const dimensions = readImageDimensions(buffer, sniffed.contentType)
    if (dimensions) {
        if (
            dimensions.width < MIN_PORTFOLIO_DIMENSION ||
            dimensions.height < MIN_PORTFOLIO_DIMENSION
        ) {
            throw new LabActionError(
                "IMAGE_TOO_SMALL",
                `Η εικόνα είναι πολύ μικρή (${dimensions.width}×${dimensions.height}). Χρειάζονται τουλάχιστον ${MIN_PORTFOLIO_DIMENSION}×${MIN_PORTFOLIO_DIMENSION} pixel.`
            )
        }
        if (
            dimensions.width > MAX_PORTFOLIO_DIMENSION ||
            dimensions.height > MAX_PORTFOLIO_DIMENSION
        ) {
            throw new LabActionError(
                "IMAGE_TOO_LARGE",
                `Η εικόνα είναι πολύ μεγάλη (${dimensions.width}×${dimensions.height}).`
            )
        }
    }

    return { ...sniffed, dimensions }
}

/** Stores the image of a portfolio item (encrypted in the database). */
export async function storePortfolioImage(itemId: string, body: Buffer) {
    const payload = encryptBuffer(body)

    if (isBlobConfigured()) {
        try {
            const { put } = await import("@vercel/blob")
            const result = await put(`portfolio/${itemId}`, payload, {
                access: "private",
                contentType: "application/octet-stream",
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            return { storagePath: result.url, storageProvider: "blob" as const }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "unknown error"
            console.warn(`[lab-portfolio] Blob storage failed (${message}). Using the database.`)
        }
    }

    await prisma.portfolioItem.update({
        where: { id: itemId },
        data: { content: payload },
    })

    return { storagePath: `db:${itemId}`, storageProvider: "db" as const }
}

/** Reads the image of a portfolio item. */
export async function readPortfolioImage(item: {
    storagePath: string
    storageProvider: string
    content: Buffer | null
    mimeType: string
}) {
    if (item.storageProvider === "db") {
        if (!item.content) throw new Error("The image is not stored")
        const raw = Buffer.from(item.content)
        return isEncryptedPayload(raw) ? decryptBuffer(raw) : raw
    }

    const response = await fetch(item.storagePath)
    if (!response.ok) throw new Error("The image could not be read")
    const raw = Buffer.from(await response.arrayBuffer())
    return isEncryptedPayload(raw) ? decryptBuffer(raw) : raw
}

/** The portfolio of a designer or a lab, ordered for the gallery. */
export async function getPortfolio(ownerType: PortfolioOwnerType, ownerId: string) {
    const where =
        ownerType === "DESIGNER"
            ? { ownerType: "DESIGNER", designerProfileId: ownerId }
            : { ownerType: "LAB", labProfileId: ownerId }

    return prisma.portfolioItem.findMany({
        where,
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

/**
 * The profile of the signed in designer or lab, for the portfolio manager.
 * Returns null when the user has no profile of that kind.
 */
export async function getOwnPortfolioOwner(ownerType: PortfolioOwnerType) {
    if (ownerType === "DESIGNER") {
        const actor = await import("@/lib/lab-domain").then((m) => m.getLabActor())
        if (!actor?.isDesigner || !actor.designerProfileId) return null
        return { id: actor.designerProfileId, userId: actor.userId }
    }

    const actor = await import("@/lib/lab-domain").then((m) => m.getLabActor())
    if (!actor || actor.role !== "LAB") return null
    const lab = await prisma.labProfile.findUnique({
        where: { userId: actor.userId },
        select: { id: true },
    })
    if (!lab) return null
    return { id: lab.id, userId: actor.userId }
}
