"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
    AlertCircle,
    CheckCircle2,
    ImagePlus,
    Loader2,
    Star,
    Trash2,
    Pencil,
    ArrowLeft,
    ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    deletePortfolioItem,
    reorderPortfolioItems,
    setPortfolioCover,
    updatePortfolioItem,
} from "@/app/actions/lab-portfolio"
import { uploadFileInChunks } from "@/lib/lab-upload-client"
import { errorMessage } from "@/lib/error-message"
import type { PortfolioItemView } from "@/components/lab/portfolio-gallery"
import { PORTFOLIO_CATEGORIES } from "@/lib/lab-portfolio-client"

const MAX_DIMENSION = 1600

/** Scales the image down in the browser: smaller upload, no metadata. */
async function optimizeImage(file: File): Promise<File> {
    try {
        const bitmap = await createImageBitmap(file)
        const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const ctx = canvas.getContext("2d")
        if (!ctx) return file
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.85)
        )
        if (!blob) return file
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
        })
    } catch {
        return file
    }
}

export function PortfolioManager({
    ownerType,
    items,
}: {
    ownerType: "DESIGNER" | "LAB"
    items: PortfolioItemView[]
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState({ title: "", description: "", category: "" })
    const fileRef = useRef<HTMLInputElement>(null)

    const run = (fn: () => Promise<unknown>, success?: string) => {
        setError(null)
        setMessage(null)
        startTransition(async () => {
            try {
                await fn()
                if (success) setMessage(success)
                router.refresh()
            } catch (err: unknown) {
                setError(errorMessage(err))
            }
        })
    }

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return
        setError(null)
        setMessage(null)
        setUploading(true)
        setProgress(0)

        const files = Array.from(fileList).slice(0, 5)

        for (const file of files) {
            try {
                const optimized = await optimizeImage(file)
                await uploadFileInChunks({
                    file: optimized,
                    kind: "PORTFOLIO",
                    onProgress: (percent) => setProgress(percent),
                    completeExtra: {
                        target: "portfolio",
                        ownerType,
                        title: file.name.replace(/\.[^.]+$/, ""),
                        description: "",
                        category: "",
                    },
                })
            } catch (err: unknown) {
                setError(errorMessage(err, "Η μεταφορά της εικόνας απέτυχε."))
            }
        }

        setUploading(false)
        setProgress(0)
        if (fileRef.current) fileRef.current.value = ""
        router.refresh()
    }

    const move = (index: number, direction: -1 | 1) => {
        const next = [...items]
        const target = index + direction
        if (target < 0 || target >= next.length) return
        const [moved] = next.splice(index, 1)
        next.splice(target, 0, moved)
        run(() => reorderPortfolioItems({ ownerType, ids: next.map((item) => item.id) }))
    }

    const startEdit = (item: PortfolioItemView) => {
        setEditingId(item.id)
        setEditValues({
            title: item.title,
            description: item.description || "",
            category: item.category || "",
        })
    }

    return (
        <div className="space-y-6">
            {/* Upload */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Νέα εικόνα</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Δημόσιες εικόνες από τις εργασίες σου. Δεν εμφανίζονται αρχεία πελατών.
                    </p>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => handleUpload(e.target.files)}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700"
                />

                {uploading && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Μεταφορά εικόνας…</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-400">
                    JPEG, PNG ή WebP. Η εικόνα συμπιέζεται αυτόματα στα 1600px και πρέπει να είναι
                    τουλάχιστον 320×320 pixel.
                </p>
            </div>

            {/* List */}
            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                    <ImagePlus className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    Δεν υπάρχουν ακόμα εικόνες στο portfolio σου.
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li
                            key={item.id}
                            className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3"
                        >
                            {editingId === item.id ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`title-${item.id}`}>Τίτλος</Label>
                                        <Input
                                            id={`title-${item.id}`}
                                            value={editValues.title}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({
                                                    ...prev,
                                                    title: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`category-${item.id}`}>Κατηγορία</Label>
                                        <select
                                            id={`category-${item.id}`}
                                            value={editValues.category}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({
                                                    ...prev,
                                                    category: e.target.value,
                                                }))
                                            }
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                                        >
                                            <option value="">Χωρίς κατηγορία</option>
                                            {PORTFOLIO_CATEGORIES.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`description-${item.id}`}>Περιγραφή</Label>
                                        <Textarea
                                            id={`description-${item.id}`}
                                            rows={3}
                                            value={editValues.description}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({
                                                    ...prev,
                                                    description: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            disabled={pending}
                                            onClick={() =>
                                                run(
                                                    () =>
                                                        updatePortfolioItem({
                                                            id: item.id,
                                                            title: editValues.title,
                                                            description: editValues.description,
                                                            category: editValues.category,
                                                        }),
                                                    "Η εικόνα ενημερώθηκε."
                                                )
                                            }
                                        >
                                            {pending ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                            )}
                                            Αποθήκευση
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingId(null)}
                                        >
                                            Άκυρο
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`/api/lab/portfolio/${item.id}/image`}
                                            alt={item.title}
                                            className="h-20 w-24 rounded-lg object-cover border border-gray-100"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {item.title}
                                            </p>
                                            {item.category && (
                                                <p className="text-xs text-gray-500">{item.category}</p>
                                            )}
                                            {item.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}
                                            {item.isCover && (
                                                <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                                                    <Star className="h-3 w-3" /> Εικόνα κάλυψης
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEdit(item)}
                                        >
                                            <Pencil className="h-3.5 w-3.5 mr-1" /> Επεξεργασία
                                        </Button>
                                        {!item.isCover && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={pending}
                                                onClick={() =>
                                                    run(
                                                        () => setPortfolioCover(item.id),
                                                        "Η εικόνα κάλυψης ενημερώθηκε."
                                                    )
                                                }
                                            >
                                                <Star className="h-3.5 w-3.5 mr-1" /> Κάλυψη
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pending || index === 0}
                                            onClick={() => move(index, -1)}
                                            aria-label="Μετακίνηση πριν"
                                        >
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={pending || index === items.length - 1}
                                            onClick={() => move(index, 1)}
                                            aria-label="Μετακίνηση μετά"
                                        >
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={pending}
                                            onClick={() => {
                                                if (!window.confirm("Διαγραφή της εικόνας;")) return
                                                run(
                                                    () => deletePortfolioItem(item.id),
                                                    "Η εικόνα διαγράφηκε."
                                                )
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1 text-red-600" />
                                            Διαγραφή
                                        </Button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <p className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </p>
            )}
            {message && (
                <p className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {message}
                </p>
            )}
        </div>
    )
}
