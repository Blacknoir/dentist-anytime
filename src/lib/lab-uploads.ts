// Server-only logic of the chunked uploads.
//
// A single request cannot carry a 120MB STL: the hosting platform limits the
// body of a request (Vercel: 4.5MB) and a Server Action is limited to 1MB.
// Files are therefore uploaded in chunks to a session, assembled on the
// server, verified with their SHA-256 and only then encrypted and stored.

import "server-only"

import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/lab-crypto"
import { getLabStorageProvider, hasAcceptedExtension, storeLabFile, MAX_UPLOAD_BYTES, MAX_DATABASE_UPLOAD_BYTES } from "@/lib/lab-storage"
import { INPUT_FILE_KINDS, OUTPUT_FILE_KINDS, type LabFileKind } from "@/lib/lab"
import { LabActionError } from "@/lib/lab-domain"
import { MAX_PORTFOLIO_IMAGE_BYTES } from "@/lib/lab-portfolio"

/** Size of one chunk. Must stay below the body limit of the host (4.5MB). */
export const UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024

/** A session is deleted after 6 hours. */
export const UPLOAD_SESSION_TTL_MS = 6 * 60 * 60 * 1000

export const MAX_UPLOAD_CHUNKS = 512

export type UploadLimits = {
    chunkSize: number
    maxFileSize: number
    maxDatabaseFileSize: number
    provider: "blob" | "local" | "db"
}

/**
 * The limits the client has to respect. The storage provider decides how big
 * a file may really be: inside the database the limit is much lower than on
 * a blob store.
 */
export function getUploadLimits(): UploadLimits {
    return {
        chunkSize: UPLOAD_CHUNK_BYTES,
        maxFileSize: MAX_UPLOAD_BYTES,
        maxDatabaseFileSize: MAX_DATABASE_UPLOAD_BYTES,
        provider: getLabStorageProvider(),
    }
}

/** The real limit for the current storage. */
export function effectiveMaxFileSize(provider: UploadLimits["provider"]) {
    return provider === "db" ? MAX_DATABASE_UPLOAD_BYTES : MAX_UPLOAD_BYTES
}

export function isAllowedUploadKind(kind: string): kind is LabFileKind | "PORTFOLIO" {
    return [...INPUT_FILE_KINDS, ...OUTPUT_FILE_KINDS, "PORTFOLIO"].includes(kind as LabFileKind)
}

export function assertUploadKind(kind: string) {
    if (!isAllowedUploadKind(kind)) {
        throw new LabActionError("VALIDATION", "Μη έγκυρος τύπος αρχείου.")
    }
}

/** Creates the session of a file that is going to be uploaded. */
export async function createUploadSession(input: {
    userId: string
    caseId?: string | null
    fileName: string
    fileSize: number
    mimeType?: string | null
    kind?: string | null
}) {
    const limits = getUploadLimits()
    const maxFileSize = input.kind === "PORTFOLIO"
        ? MAX_PORTFOLIO_IMAGE_BYTES
        : effectiveMaxFileSize(limits.provider)

    if (!input.fileName || input.fileName.length > 200) {
        throw new LabActionError("VALIDATION", "Μη έγκυρο όνομα αρχείου.")
    }
    if (input.kind !== "PORTFOLIO" && !hasAcceptedExtension(input.fileName)) {
        throw new LabActionError("VALIDATION", "Ο τύπος του αρχείου δεν υποστηρίζεται.")
    }
    if (!Number.isSafeInteger(input.fileSize) || input.fileSize <= 0) {
        throw new LabActionError("VALIDATION", "Το αρχείο είναι κενό.")
    }
    if (input.fileSize > maxFileSize) {
        throw new LabActionError(
            "FILE_TOO_LARGE",
            `Το αρχείο ξεπερνά το όριο των ${Math.round(maxFileSize / (1024 * 1024))}MB.`
        )
    }
    if (input.kind) assertUploadKind(input.kind)
    await cleanupExpiredUploadSessions()

    const session = await prisma.labUploadSession.create({
        data: {
            userId: input.userId,
            caseId: input.caseId ?? null,
            fileName: input.fileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType ?? null,
            kind: input.kind ?? null,
            status: "PENDING",
            expiresAt: new Date(Date.now() + UPLOAD_SESSION_TTL_MS),
        },
    })

    return {
        sessionId: session.id,
        chunkSize: limits.chunkSize,
        maxFileSize,
        provider: limits.provider,
    }
}

/**
 * Stores one chunk. The chunk index is checked against the size of the file
 * and the received bytes are updated atomically, so a retried chunk is
 * simply overwritten.
 */
export async function appendUploadChunk(input: {
    sessionId: string
    userId: string
    index: number
    data: Buffer
}) {
    const session = await prisma.labUploadSession.findUnique({
        where: { id: input.sessionId },
        select: {
            id: true,
            userId: true,
            caseId: true,
            fileSize: true,
            receivedBytes: true,
            status: true,
            expiresAt: true,
        },
    })

    if (!session) throw new LabActionError("NOT_FOUND", "Η μεταφορά δεν βρέθηκε.", 404)
    if (session.userId !== input.userId) {
        throw new LabActionError("FORBIDDEN", "Δεν έχεις δικαίωμα σε αυτή τη μεταφορά.", 403)
    }
    if (session.expiresAt.getTime() < Date.now()) {
        await prisma.labUploadSession.update({
            where: { id: session.id },
            data: { status: "EXPIRED" },
        })
        throw new LabActionError("EXPIRED", "Η μεταφορά έχει λήξει. Ξεκίνα ξανά την μεταφορά.", 410)
    }
    if (session.status === "COMPLETED") {
        throw new LabActionError("ALREADY_DONE", "Η μεταφορά ολοκληρώθηκε ήδη.", 409)
    }

    const chunkCount = Math.ceil(session.fileSize / UPLOAD_CHUNK_BYTES)
    if (!Number.isInteger(input.index) || input.index < 0 || input.index >= chunkCount) {
        throw new LabActionError("VALIDATION", "Μη έγκυρο τμήμα αρχείου.")
    }
    const expectedSize = Math.min(UPLOAD_CHUNK_BYTES, session.fileSize - input.index * UPLOAD_CHUNK_BYTES)
    if (input.data.length !== expectedSize) {
        throw new LabActionError("VALIDATION", "Μη έγκυρο μέγεθος τμήματος αρχείου.")
    }

    await prisma.labUploadChunk.upsert({
        where: { sessionId_index: { sessionId: session.id, index: input.index } },
        update: { data: input.data },
        create: { sessionId: session.id, index: input.index, data: input.data },
    })

    const received = await prisma.$queryRaw<{ bytes: bigint; count: bigint }[]>`
        SELECT COALESCE(SUM(octet_length("data")), 0) AS bytes, COUNT(*) AS count
        FROM "LabUploadChunk" WHERE "sessionId" = ${session.id}
    `

    const receivedBytes = Number(received[0].bytes)

    await prisma.labUploadSession.update({
        where: { id: session.id },
        data: { receivedBytes, status: "UPLOADING" },
    })

    return { receivedBytes, chunksStored: Number(received[0].count), chunkCount }
}

/**
 * Assembles the chunks of a session and verifies the checksum.
 * The caller decides whether it is a private case file or a portfolio image.
 */
export async function assembleUploadSession(input: {
    sessionId: string
    userId: string
    checksum?: string | null
}) {
    const session = await prisma.labUploadSession.findUnique({
        where: { id: input.sessionId },
    })

    if (!session) throw new LabActionError("NOT_FOUND", "Η μεταφορά δεν βρέθηκε.", 404)
    if (session.userId !== input.userId) {
        throw new LabActionError("FORBIDDEN", "Δεν έχεις δικαίωμα σε αυτή τη μεταφορά.", 403)
    }
    if (session.expiresAt.getTime() < Date.now()) {
        throw new LabActionError("EXPIRED", "Η μεταφορά έχει λήξει. Δοκίμασε ξανά.", 410)
    }
    if (session.status === "COMPLETED") {
        throw new LabActionError("ALREADY_DONE", "Η μεταφορά ολοκληρώθηκε ήδη.", 409)
    }

    const chunks = await prisma.labUploadChunk.findMany({
        where: { sessionId: session.id },
        select: { index: true, data: true },
        orderBy: { index: "asc" },
    })

    const expectedChunks = Math.ceil(session.fileSize / UPLOAD_CHUNK_BYTES)
    if (chunks.length !== expectedChunks) {
        throw new LabActionError(
            "INCOMPLETE",
            "Λείπουν τμήματα του αρχείου. Δοκίμασε ξανά τη μεταφορά.",
            409
        )
    }

    const body = Buffer.concat(chunks.map((chunk) => chunk.data))
    if (body.length !== session.fileSize) {
        throw new LabActionError("INCOMPLETE", "Το αρχείο δεν συμπληρώθηκε σωστά.", 409)
    }

    // The checksum proves that the file arrived unchanged.
    const digest = sha256(body)
    if (input.checksum && input.checksum.toLowerCase() !== digest) {
        await prisma.labUploadSession.update({
            where: { id: session.id },
            data: { status: "FAILED", errorMessage: "checksum_mismatch" },
        })
        throw new LabActionError("CHECKSUM_MISMATCH", "Το αρχείο δεν έφτασε ακέραιο. Δοκίμασε ξανά.", 409)
    }

    return { body, digest, session }
}

/**
 * Assembles the chunks, verifies the checksum and stores the file encrypted.
 * The file row is only created when the storage really worked.
 */
export async function completeUploadSession(input: {
    sessionId: string
    userId: string
    checksum?: string | null
    uploaderRole: "CUSTOMER" | "DESIGNER"
    kind: LabFileKind
    caseId: string
}) {
    const { body, digest, session } = await assembleUploadSession({
        sessionId: input.sessionId,
        userId: input.userId,
        checksum: input.checksum,
    })

    const record = await prisma.labCaseFile.create({
        data: {
            id: session.id,
            caseId: input.caseId,
            kind: input.kind,
            fileName: session.fileName,
            fileSize: body.length,
            mimeType: session.mimeType,
            storagePath: "pending",
            storageProvider: "local",
            uploadedById: input.userId,
            uploaderRole: input.uploaderRole,
        },
    })

    let stored: Awaited<ReturnType<typeof storeLabFile>> | undefined
    try {
        stored = await storeLabFile({
            caseId: input.caseId,
            fileName: session.fileName,
            body,
            contentType: session.mimeType ?? undefined,
            fileId: record.id,
        })

        await prisma.$transaction([
            prisma.labCaseFile.update({
                where: { id: record.id },
                data: { storagePath: stored.storagePath, storageProvider: stored.storageProvider },
            }),
            prisma.labUploadSession.update({
                where: { id: session.id },
                data: { status: "COMPLETED", checksum: digest },
            }),
            prisma.labUploadChunk.deleteMany({ where: { sessionId: session.id } }),
        ])

        return { fileId: record.id, checksum: digest, provider: stored.storageProvider }
    } catch (error) {
        if (stored && stored.storageProvider !== "db") {
            const { deleteLabFile } = await import("@/lib/lab-storage")
            await deleteLabFile(stored.storagePath, stored.storageProvider).catch(() => undefined)
        }
        await prisma.labCaseFile.delete({ where: { id: record.id } }).catch(() => undefined)
        await prisma.labUploadSession.update({
            where: { id: session.id },
            data: {
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "storage_error",
            },
        })
        throw error
    }
}

/**
 * Completes an upload of a portfolio image: the image is checked (real type
 * and dimensions), stored encrypted and attached to the portfolio of the
 * owner.
 */
export async function completePortfolioUpload(input: {
    sessionId: string
    userId: string
    checksum?: string | null
    ownerType: "DESIGNER" | "LAB"
    title: string
    description?: string | null
    category?: string | null
}) {
    const { validatePortfolioImage, storePortfolioImage, getOwnPortfolioOwner } = await import(
        "@/lib/lab-portfolio"
    )

    const owner = await getOwnPortfolioOwner(input.ownerType)
    if (!owner || owner.userId !== input.userId) {
        throw new LabActionError("FORBIDDEN", "Δεν έχεις δικαίωμα σε αυτό το portfolio.", 403)
    }

    const { body, digest, session } = await assembleUploadSession({
        sessionId: input.sessionId,
        userId: input.userId,
        checksum: input.checksum,
    })

    if (session.kind !== "PORTFOLIO" || session.caseId) {
        throw new LabActionError("VALIDATION", "Η μεταφορά δεν ανήκει στο portfolio.")
    }

    const image = validatePortfolioImage(body)

    const title = input.title?.trim() || session.fileName.replace(/\.[^.]+$/, "")
    if (title.length > 120) {
        throw new LabActionError("VALIDATION", "Ο τίτλος είναι πολύ μεγάλος (έως 120 χαρακτήρες).")
    }

    const position = await prisma.portfolioItem.count({
        where:
            input.ownerType === "DESIGNER"
                ? { ownerType: "DESIGNER", designerProfileId: owner.id }
                : { ownerType: "LAB", labProfileId: owner.id },
    })

    const item = await prisma.portfolioItem.create({
        data: {
            id: session.id,
            ownerType: input.ownerType,
            designerProfileId: input.ownerType === "DESIGNER" ? owner.id : null,
            labProfileId: input.ownerType === "LAB" ? owner.id : null,
            title,
            description: input.description?.trim() || null,
            category: input.category?.trim() || "",
            fileName: session.fileName,
            mimeType: image.contentType,
            fileSize: body.length,
            width: image.dimensions?.width ?? null,
            height: image.dimensions?.height ?? null,
            storagePath: "pending",
            storageProvider: "db",
            position,
        },
    })

    try {
        const stored = await storePortfolioImage(item.id, body)

        await prisma.$transaction([
            prisma.portfolioItem.update({
                where: { id: item.id },
                data: { storagePath: stored.storagePath, storageProvider: stored.storageProvider },
            }),
            prisma.labUploadSession.update({
                where: { id: session.id },
                data: { status: "COMPLETED", checksum: digest },
            }),
            prisma.labUploadChunk.deleteMany({ where: { sessionId: session.id } }),
        ])

        return { itemId: item.id, checksum: digest }
    } catch (error) {
        await prisma.portfolioItem.delete({ where: { id: item.id } }).catch(() => undefined)
        await prisma.labUploadSession.update({
            where: { id: session.id },
            data: {
                status: "FAILED",
                errorMessage: error instanceof Error ? error.message : "storage_error",
            },
        })
        throw error
    }
}

/** Cancels a session and removes the uploaded chunks. */
export async function cancelUploadSession(sessionId: string, userId: string) {
    const session = await prisma.labUploadSession.findUnique({
        where: { id: sessionId },
        select: { id: true, userId: true, status: true },
    })
    if (!session) return
    if (session.userId !== userId) {
        throw new LabActionError("FORBIDDEN", "Δεν έχεις δικαίωμα σε αυτή τη μεταφορά.", 403)
    }
    if (session.status === "COMPLETED") return

    await prisma.labUploadChunk.deleteMany({ where: { sessionId } })
    await prisma.labUploadSession.update({
        where: { id: sessionId },
        data: { status: "FAILED", errorMessage: "cancelled" },
    })
}

/** Free abandoned chunks in small batches when another upload starts. */
export async function cleanupExpiredUploadSessions() {
    const expired = await prisma.labUploadSession.findMany({
        where: { expiresAt: { lt: new Date() }, status: { in: ["PENDING", "UPLOADING", "FAILED"] } },
        select: { id: true },
        orderBy: { expiresAt: "asc" },
        take: 20,
    })
    for (const session of expired) {
        await prisma.$transaction([
            prisma.labUploadChunk.deleteMany({ where: { sessionId: session.id } }),
            prisma.labUploadSession.update({
                where: { id: session.id },
                data: { status: "EXPIRED" },
            }),
        ])
    }
    return expired.length
}
