"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type PortfolioItemView = {
    id: string
    title: string
    description: string | null
    category: string
    mimeType: string
    width: number | null
    height: number | null
    isCover: boolean
    position: number
}

/**
 * Responsive gallery of the portfolio with a lightbox. The gallery works
 * without JavaScript (the images are plain <img>), the lightbox is an
 * enhancement.
 */
export function PortfolioGallery({
    items,
    emptyLabel = "Δεν υπάρχουν ακόμα εικόνες στο portfolio.",
}: {
    items: PortfolioItemView[]
    emptyLabel?: string
}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    useEffect(() => {
        if (activeIndex === null) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setActiveIndex(null)
            if (event.key === "ArrowRight") {
                setActiveIndex((index) => (index === null ? null : (index + 1) % items.length))
            }
            if (event.key === "ArrowLeft") {
                setActiveIndex((index) =>
                    index === null ? null : (index - 1 + items.length) % items.length
                )
            }
        }
        window.addEventListener("keydown", onKey)
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = ""
        }
    }, [activeIndex, items.length])

    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                <ImageIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                {emptyLabel}
            </div>
        )
    }

    const active = activeIndex === null ? null : items[activeIndex]
    const activePosition = activeIndex ?? 0

    return (
        <>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item, index) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "group relative block w-full overflow-hidden rounded-xl border bg-white",
                                item.isCover ? "border-primary-300" : "border-gray-200"
                            )}
                            aria-label={`${item.title}${item.category ? ` — ${item.category}` : ""}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`/api/lab/portfolio/${item.id}/image`}
                                alt={item.title}
                                loading="lazy"
                                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {item.isCover && (
                                <span className="absolute left-2 top-2 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                    Κάλυψη
                                </span>
                            )}
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 text-left">
                                <span className="block truncate text-xs font-medium text-white">
                                    {item.title}
                                </span>
                                {item.category && (
                                    <span className="block truncate text-[10px] text-white/80">
                                        {item.category}
                                    </span>
                                )}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>

            {active && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label={active.title}
                    onClick={() => setActiveIndex(null)}
                >
                    <button
                        type="button"
                        onClick={() => setActiveIndex(null)}
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        aria-label="Κλείσιμο"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {items.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setActiveIndex(
                                        (activePosition - 1 + items.length) % items.length
                                    )
                                }}
                                className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                                aria-label="Προηγούμενη"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    setActiveIndex((activePosition + 1) % items.length)
                                }}
                                className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                                aria-label="Επόμενη"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        </>
                    )}

                    <figure
                        className="max-h-[85vh] max-w-4xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/lab/portfolio/${active.id}/image`}
                            alt={active.title}
                            className="max-h-[70vh] w-auto rounded-xl object-contain"
                        />
                        <figcaption className="mt-3 text-center">
                            <p className="text-sm font-semibold text-white">{active.title}</p>
                            {active.category && (
                                <p className="text-xs text-white/70">{active.category}</p>
                            )}
                            {active.description && (
                                <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white/80">
                                    {active.description}
                                </p>
                            )}
                        </figcaption>
                    </figure>
                </div>
            )}
        </>
    )
}
