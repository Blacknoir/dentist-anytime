// File storage for the Lab marketplace.
// Primary provider: Vercel Blob (BLOB_READ_WRITE_TOKEN).
// Fallback for local development: files are written under ./.lab-uploads and
// served through the authenticated /api/lab/files/[id] route.

import { mkdir, readFile, writeFile, unlink } from "fs/promises"
import path from "path"
import { decryptBuffer, encryptBuffer, isEncryptedPayload } from "@/lib/lab-crypto"

export const MAX_UPLOAD_BYTES = 120 * 1024 * 1024 // 120MB (STL scans can be large)

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

export type StorageProvider = "blob" | "local"

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

export async function storeLabFile(params: {
    caseId: string
    fileName: string
    body: Buffer
    contentType?: string
}): Promise<{ storagePath: string; storageProvider: StorageProvider }> {
    const objectPath = buildStoragePath(params.caseId, params.fileName)
    const payload = encryptBuffer(params.body)

    if (isBlobConfigured()) {
        try {
            const { put } = await import("@vercel/blob")
            const result = await put(objectPath, payload, {
                access: "private",
                contentType: "application/octet-stream",
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            return { storagePath: result.url, storageProvider: "blob" }
        } catch (error: any) {
            console.warn(
                `[lab-storage] Private blob upload failed (${error?.message}). Falling back to public store.`
            )
            const { put } = await import("@vercel/blob")
            const result = await put(objectPath, payload, {
                access: "public",
                contentType: "application/octet-stream",
                addRandomSuffix: false,
                token: process.env.BLOB_READ_WRITE_TOKEN,
            })
            return { storagePath: result.url, storageProvider: "blob" }
        }
    }

    const target = path.join(getLocalUploadRoot(), objectPath)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, payload)
    return { storagePath: objectPath, storageProvider: "local" }
}

export async function readLabFile(storagePath: string, provider: StorageProvider) {
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

export async function deleteLabFile(storagePath: string, provider: StorageProvider) {
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
