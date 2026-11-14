"use client"

// Client helper of the chunked upload. The file is split into chunks that
// fit into the body limit of the host, every chunk is sent separately and the
// server assembles, verifies (sha256) and stores the file encrypted.

export const UPLOAD_CHUNK_FALLBACK = 4 * 1024 * 1024

export type UploadProgress = (percent: number) => void

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

    const sessionRes = await fetch("/api/lab/uploads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            caseId: caseId ?? null,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || null,
            kind,
        }),
        signal,
    })
    const session = await sessionRes.json().catch(() => ({}))
    if (!sessionRes.ok) {
        throw new Error(session?.error || "Η μεταφορά ξεκίνησε με απότυχία.")
    }

    const chunkSize: number = session.chunkSize || UPLOAD_CHUNK_FALLBACK
    const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize))
    const checksum = await sha256Hex(file)

    for (let index = 0; index < chunkCount; index++) {
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
                    const payload = await res.json().catch(() => ({}))
                    throw new Error(payload?.error || "Το τμήμα του αρχείου δεν στάλθηκε.")
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

        onProgress?.(Math.round(((index + 1) / chunkCount) * 95))
    }

    onProgress?.(98)

    const completeRes = await fetch(`/api/lab/uploads/${session.sessionId}`, {
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
    const payload = await completeRes.json().catch(() => ({}))
    if (!completeRes.ok) {
        throw new Error(payload?.error || "Η αποθήκευση του αρχείου απέτυχε.")
    }

    onProgress?.(100)

    return { fileId: payload.fileId as string, name: file.name, checksum }
}
