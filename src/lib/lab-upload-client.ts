"use client"

// Client helper of the chunked upload. The file is split into chunks that
// fit into the body limit of the host, every chunk is sent separately and the
// server assembles, verifies (sha256) and stores the file encrypted.

export const UPLOAD_CHUNK_FALLBACK = 4 * 1024 * 1024

export type UploadProgress = (percent: number) => void
type PendingUpload = {
    target: string
    sessionId: string
    chunkSize: number
    checksum: string
    nextChunk: number
}

// Keep a failed file's session for the retry button while the page is open.
const pendingUploads = new WeakMap<File, PendingUpload>()

async function uploadError(response: Response, fallback: string) {
    const payload = await response.json().catch(() => null)
    if (typeof payload?.error === "string") return payload.error
    if (response.status === 413) return "Το αρχείο ή το τμήμα του ξεπερνά το επιτρεπόμενο μέγεθος."
    if (response.status === 401) return "Η σύνδεσή σου έληξε. Συνδέσου ξανά."
    return fallback
}

export async function sha256Hex(file: Blob) {
    const buffer = await file.arrayBuffer()
    const digest = await crypto.subtle.digest("SHA-256", buffer)
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")
}

export async function uploadFileInChunks(input: {
    file: File
    caseId?: string | null
    kind: string
    onProgress?: UploadProgress
    signal?: AbortSignal
    completeExtra?: Record<string, unknown>
}) {
    const { file, caseId, kind, onProgress, signal, completeExtra } = input

    const target = JSON.stringify([caseId ?? null, kind, completeExtra?.ownerType ?? null])
    let session = pendingUploads.get(file)
    if (!session || session.target !== target) {
        const sessionRes = await fetch("/api/lab/uploads", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                caseId: caseId ?? null,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || null,
                kind,
                ownerType: completeExtra?.ownerType,
            }),
            signal,
        })
        if (!sessionRes.ok) {
            throw new Error(await uploadError(sessionRes, "Η μεταφορά δεν ξεκίνησε. Δοκίμασε ξανά."))
        }
        const payload = await sessionRes.json()
        if (typeof payload.sessionId !== "string") throw new Error("Δεν ήταν δυνατή η έναρξη της μεταφοράς.")
        session = {
            target,
            sessionId: payload.sessionId,
            chunkSize: payload.chunkSize || UPLOAD_CHUNK_FALLBACK,
            checksum: await sha256Hex(file),
            nextChunk: 0,
        }
        pendingUploads.set(file, session)
    }

    const { chunkSize, checksum } = session
    const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize))

    for (let index = session.nextChunk; index < chunkCount; index++) {
        const start = index * chunkSize
        const chunk = file.slice(start, Math.min(start + chunkSize, file.size))

        let lastError: Error | null = null
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(
                    `/api/lab/uploads/${session.sessionId}?index=${index}`,
                    {
                        method: "PUT",
                        headers: { "content-type": "application/octet-stream" },
                        body: chunk,
                        signal,
                    }
                )
                if (!res.ok) {
                    if (res.status === 404 || res.status === 410) pendingUploads.delete(file)
                    throw new Error(await uploadError(res, "Το τμήμα του αρχείου δεν στάλθηκε."))
                }
                lastError = null
                break
            } catch (error: unknown) {
                if (error instanceof Error && error.name === "AbortError") throw error
                lastError = error instanceof Error ? error : new Error("Το τμήμα του αρχείου δεν στάλθηκε.")
                await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)))
            }
        }
        if (lastError) throw lastError
        session.nextChunk = index + 1

        onProgress?.(Math.round(((index + 1) / chunkCount) * 95))
    }

    onProgress?.(98)

    const complete = () => fetch(`/api/lab/uploads/${session.sessionId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            checksum,
            kind,
            caseId: caseId ?? null,
            ...(completeExtra || {}),
        }),
        signal,
    })
    let completeRes: Response
    try {
        completeRes = await complete()
    } catch (error) {
        if (signal?.aborted) throw error
        completeRes = await complete()
    }
    if (!completeRes.ok) {
        if ([401, 403, 404, 410].includes(completeRes.status)) pendingUploads.delete(file)
        if (completeRes.status === 409) session.nextChunk = 0
        throw new Error(await uploadError(completeRes, "Η αποθήκευση του αρχείου απέτυχε."))
    }
    const payload = await completeRes.json()

    pendingUploads.delete(file)
    onProgress?.(100)

    return { fileId: (payload.fileId || payload.itemId) as string, name: file.name, checksum }
}
