// File storage for the Lab marketplace.
//
// Providers:
//   1. Vercel Blob (private) when BLOB_READ_WRITE_TOKEN is configured.
//   2. Local disk (./.lab-uploads or LAB_UPLOAD_DIR) when the filesystem is writable.
//   3. The database (LabCaseFile.content) — the fallback that keeps uploads
//      working on read-only hosts such as Vercel serverless functions.
//
// Every file is encrypted (AES-256-GCM) before it leaves the application.

import { mkdir, readFile, writeFile, unlink } from "fs/promises"
import path from "path"
import { decryptBuffer, encryptBuffer, isEncryptedPayload } from "@/lib/lab-crypto"
import { prisma } from "@/lib/prisma"

export const MAX_UPLOAD_BYTES = 120 * 1024 * 1024 // 120MB (STL scans can be large)
export const MAX_DATABASE_UPLOAD_BYTES = 25 * 1024 * 1024 // 25MB when stored in the database

export const ACCEPTED_EXTENSIONS = [
    ".stl",
    ".obj",
    ".3mf",
    ".zip",
    ".step",
    ".stp",
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".dcm",
    ".txt",
    ".doc",
    ".docx",
]

export type StorageProvider = "blob" | "local" | "db"

export function isBlobConfigured() {
    return !!process.env.BLOB_READ_WRITE_TOKEN
}

export function getLocalUploadRoot() {
    // LAB_UPLOAD_DIR allows pointing the local fallback somewhere writable
    // (e.g. /tmp on serverless hosts). Vercel needs BLOB_READ_WRITE_TOKEN.
    return process.env.LAB_UPLOAD_DIR
        ? path.resolve(process.env.LAB_UPLOAD_DIR)
        : path.join(process.cwd(), ".lab-uploads")
}

export function sanitizeFileName(name: string) {
    const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120)
    return cleaned || "file"
}

export function hasAcceptedExtension(name: string) {
    const lower = name.toLowerCase()
    return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function buildStoragePath(caseId: string, fileName: string) {
    const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    return `lab/${caseId}/${unique}/${sanitizeFileName(fileName)}`
}

async function writeToBlob(objectPath: string, payload: Buffer) {
    const { put } = await import("@vercel/blob")
    try {
        const result = await put(objectPath, payload, {
            access: "private",
            contentType: "application/octet-stream",
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        return result.url
    } catch (error: any) {
        console.warn(
            `[lab-storage] Private blob upload failed (${error?.message}). Falling back to public store.`
        )
        const result = await put(objectPath, payload, {
            access: "public",
            contentType: "application/octet-stream",
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        return result.url
    }
}

async function writeToDisk(objectPath: string, payload: Buffer) {
    const target = path.join(getLocalUploadRoot(), objectPath)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, payload)
    return objectPath
}

/**
 * Stores a file and returns where it ended up. The database is used as the
 * last resort so that uploads keep working on hosts with a read-only
 * filesystem (Vercel).
 */
export async function storeLabFile(params: {
    caseId: string
    fileName: string
    body: Buffer
    contentType?: string
    fileId?: string
}): Promise<{ storagePath: string; storageProvider: StorageProvider }> {
    const objectPath = buildStoragePath(params.caseId, params.fileName)
    const payload = encryptBuffer(params.body)

    if (isBlobConfigured()) {
        try {
            const url = await writeToBlob(objectPath, payload)
            return { storagePath: url, storageProvider: "blob" }
        } catch (error: any) {
            console.warn(`[lab-storage] Blob storage failed (${error?.message}). Using the database.`)
        }
    } else {
        try {
            const localPath = await writeToDisk(objectPath, payload)
            return { storagePath: localPath, storageProvider: "local" }
        } catch (error: any) {
            console.warn(
                `[lab-storage] Local storage is not writable (${error?.message}). Using the database.`
            )
        }
    }

    if (payload.length > MAX_DATABASE_UPLOAD_BYTES) {
        throw new Error(
            "Το αρχείο είναι πολύ μεγάλο για την αποθήκευση στη βάση. Ρύθμισε BLOB_READ_WRITE_TOKEN για αποθήκευση στο Vercel Blob."
        )
    }

    if (!params.fileId) {
        throw new Error("Δεν ήταν δυνατή η αποθήκευση του αρχείου.")
    }

    await prisma.labCaseFile.update({
        where: { id: params.fileId },
        data: { content: payload },
    })

    return { storagePath: `db:${params.fileId}`, storageProvider: "db" }
}

export async function readLabFile(
    storagePath: string,
    provider: StorageProvider,
    fileId?: string
) {
    if (provider === "db") {
        const record = await prisma.labCaseFile.findUnique({
            where: { id: fileId || storagePath.replace(/^db:/, "") },
            select: { content: true, fileName: true },
        })
        if (!record?.content) throw new Error("Could not read stored file (database)")
        const raw = Buffer.from(record.content)
        const body = isEncryptedPayload(raw) ? decryptBuffer(raw) : raw
        return { body, contentType: guessContentType(record.fileName) }
    }

    const raw = await readRawFile(storagePath, provider)
    if (isEncryptedPayload(raw)) {
        return { body: decryptBuffer(raw), contentType: guessContentType(storagePath) }
    }
    return { body: raw, contentType: guessContentType(storagePath) }
}

async function readRawFile(storagePath: string, provider: StorageProvider) {
    if (provider === "local") {
        const target = path.join(getLocalUploadRoot(), storagePath)
        return readFile(target)
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN

    let response = await fetch(storagePath)
    if (!response.ok && token) {
        response = await fetch(storagePath, { headers: { Authorization: `Bearer ${token}` } })
    }
    if (!response.ok) {
        throw new Error(`Could not read stored file (${response.status})`)
    }

    return Buffer.from(await response.arrayBuffer())
}

export async function deleteLabFile(
    storagePath: string,
    provider: StorageProvider,
    fileId?: string
) {
    if (provider === "db") {
        if (fileId) {
            await prisma.labCaseFile
                .update({ where: { id: fileId }, data: { content: null } })
                .catch(() => undefined)
        }
        return
    }

    if (provider === "local") {
        const target = path.join(getLocalUploadRoot(), storagePath)
        await unlink(target).catch(() => undefined)
        return
    }

    if (!isBlobConfigured()) return
    try {
        const { del } = await import("@vercel/blob")
        await del(storagePath, { token: process.env.BLOB_READ_WRITE_TOKEN })
    } catch (error) {
        console.warn("[lab-storage] Failed to delete blob:", error)
    }
}

function guessContentType(fileName: string) {
    const lower = fileName.toLowerCase()
    if (lower.endsWith(".stl")) return "model/stl"
    if (lower.endsWith(".obj")) return "model/obj"
    if (lower.endsWith(".pdf")) return "application/pdf"
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".zip")) return "application/zip"
    if (lower.endsWith(".txt")) return "text/plain"
    return "application/octet-stream"
}
