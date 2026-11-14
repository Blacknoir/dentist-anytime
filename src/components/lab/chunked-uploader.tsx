"use client"

import { useCallback, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadFileInChunks } from "@/lib/lab-upload-client"
import { errorMessage } from "@/lib/error-message"

// Client side of the chunked upload.
//
// The file is split into chunks that fit into the body limit of the host, the
// chunks are sent one after the other and the server assembles, verifies and
// stores the file. A failed chunk is retried, a failed file can be uploaded
// again without creating a second work.

export type UploadItemState = {
    key: string
    name: string
    size: number
    status: "queued" | "uploading" | "processing" | "done" | "error"
    progress: number
    error?: string
}

type ChunkedUploaderProps = {
    caseId?: string | null
    kind: string
    accept?: string
    multiple?: boolean
    disabled?: boolean
    label?: string
    onCompleted?: (result: { fileId: string; name: string }) => void
    onError?: (message: string) => void
}

export function ChunkedUploader({
    caseId,
    kind,
    accept,
    multiple = true,
    disabled = false,
    label = "Ανέβασε αρχεία",
    onCompleted,
    onError,
}: ChunkedUploaderProps) {
    const [items, setItems] = useState<UploadItemState[]>([])
    const [uploading, setUploading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const filesRef = useRef<Map<string, File>>(new Map())
    const keyCounter = useRef(0)

    const patch = useCallback((key: string, values: Partial<UploadItemState>) => {
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...values } : item)))
    }, [])

    const uploadFile = useCallback(
        async (key: string, file: File) => {
            patch(key, { status: "uploading", progress: 0, error: undefined })

            try {
                patch(key, { status: "processing", progress: 1 })
                const result = await uploadFileInChunks({
                    file,
                    caseId,
                    kind,
                    onProgress: (percent) => patch(key, { progress: percent }),
                })

                patch(key, { status: "done", progress: 100 })
                onCompleted?.({ fileId: result.fileId, name: result.name })
            } catch (error: unknown) {
                const message = errorMessage(error, "Η μεταφορά απέτυχε.")
                patch(key, { status: "error", error: message })
                onError?.(message)
            }
        },
        [caseId, kind, onCompleted, onError, patch]
    )

    const handleFiles = (list: FileList | null) => {
        if (!list || list.length === 0) return
        const next = Array.from(list)
        const created: UploadItemState[] = []

        for (const file of next) {
            // A counter instead of Math.random: the render must stay pure.
            keyCounter.current += 1
            const key = `${file.name}-${file.size}-${file.lastModified}-${keyCounter.current}`
            filesRef.current.set(key, file)
            created.push({
                key,
                name: file.name,
                size: file.size,
                status: "queued",
                progress: 0,
            })
        }

        setItems((prev) => [...prev, ...created])
        setUploading(true)

        // The files are sent one after the other: the host allows a limited
        // number of parallel requests and the progress stays readable.
        ;(async () => {
            for (const item of created) {
                const file = filesRef.current.get(item.key)
                if (file) await uploadFile(item.key, file)
            }
            setUploading(false)
        })()
    }

    const retry = (key: string) => {
        const file = filesRef.current.get(key)
        if (!file) return
        setUploading(true)
        uploadFile(key, file).finally(() => setUploading(false))
    }

    const remove = (key: string) => {
        filesRef.current.delete(key)
        setItems((prev) => prev.filter((item) => item.key !== key))
    }

    return (
        <div className="space-y-3">
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple={multiple}
                accept={accept}
                onChange={(event) => {
                    handleFiles(event.target.files)
                    event.target.value = ""
                }}
            />

            <Button
                type="button"
                variant="outline"
                disabled={disabled || uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Upload className="h-4 w-4 mr-2" />
                )}
                {label}
            </Button>

            {items.length > 0 && (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li
                            key={item.key}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 min-w-0">
                                    {item.status === "done" && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                    )}
                                    {item.status === "error" && (
                                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                                    )}
                                    {(item.status === "uploading" || item.status === "processing") && (
                                        <Loader2 className="h-4 w-4 text-primary-600 animate-spin shrink-0" />
                                    )}
                                    <span className="truncate">{item.name}</span>
                                </span>
                                <span className="text-xs text-gray-500 shrink-0">
                                    {item.status === "uploading" || item.status === "processing"
                                        ? `${item.progress}%`
                                        : item.status === "done"
                                          ? "Ολοκληρώθηκε"
                                          : item.status === "error"
                                            ? "Απέτυχε"
                                            : "Σε αναμονή"}
                                </span>
                            </div>

                            {item.status === "uploading" && (
                                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full bg-primary-600 transition-all"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                            )}

                            {item.error && (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {item.error}
                                </p>
                            )}

                            {item.status === "error" && (
                                <div className="mt-2 flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => retry(item.key)}
                                    >
                                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Επανάληψη
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => remove(item.key)}
                                    >
                                        Αφαίρεση
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
