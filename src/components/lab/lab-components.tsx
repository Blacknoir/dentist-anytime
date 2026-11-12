"use client"

import Link from "next/link"
import { Star, MapPin, BadgeCheck, Timer, Euro, FileUp, Camera, Paperclip, ShieldCheck, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    codeInitials,
    euros,
    formatBytes,
    formatDate,
    PAYMENT_STATUS_META,
    STATUS_META,
    type DesignerListItem,
    type LabCaseFileItem,
    type LabCaseListItem,
} from "@/lib/lab"
import { cn } from "@/lib/utils"
import { FileDownloadButton } from "@/components/lab/file-download-button"

export function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status as keyof typeof STATUS_META] ?? {
        label: status,
        classes: "bg-gray-100 text-gray-600 border-gray-200",
    }
    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", meta.classes)}>
            {meta.label}
        </span>
    )
}

export function PaymentBadge({ status }: { status: string }) {
    const meta = PAYMENT_STATUS_META[status] ?? {
        label: status,
        classes: "bg-gray-100 text-gray-600 border-gray-200",
    }
    return (
        <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", meta.classes)}>
            {meta.label}
        </span>
    )
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
    return (
        <span className="inline-flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <strong>{rating.toFixed(1)}</strong>
            {count !== undefined && <span className="text-gray-400">({count})</span>}
        </span>
    )
}

export function CaseCard({ c }: { c: LabCaseListItem }) {
    return (
        <Link href={`/lab/cases/${c.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-gray-500">{c.code}</span>
                        <div className="flex items-center gap-1.5">
                            {c.priority === "EXPRESS" && (
                                <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-bold">
                                    EXPRESS
                                </span>
                            )}
                            <StatusBadge status={c.status} />
                        </div>
                    </div>
                    <h3 className="font-bold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{c.description}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className="bg-gray-100 rounded-full px-2 py-0.5">{c.type}</span>
                        <span className="bg-gray-100 rounded-full px-2 py-0.5">{c.material}</span>
                        {c.shade && <span className="bg-gray-100 rounded-full px-2 py-0.5">Απόχρωση {c.shade}</span>}
                        <span className="bg-gray-100 rounded-full px-2 py-0.5">{c.units} τεμ.</span>
                        {c.deadline && (
                            <span className="bg-gray-100 rounded-full px-2 py-0.5">Παράδοση {formatDate(c.deadline)}</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-sm pt-1">
                        <span className="text-gray-500">
                            {c._count.files} αρχεία · {c._count.offers} προσφορές
                        </span>
                        {c.agreedPrice ? (
                            <span className="text-xs font-bold text-gray-900">{euros(c.agreedPrice)}</span>
                        ) : (
                            <span className="text-xs font-bold text-primary-600">Δες προσφορές →</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export function DesignerCard({ designer }: { designer: DesignerListItem }) {
    const prices = designer.services.map((service) => service.price)
    const priceFrom = prices.length ? Math.min(...prices) : null
    const tag = "CD"

    return (
        <Link href={`/lab/designers/${designer.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full h-full">
                <CardContent className="p-5 space-y-3 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold">
                                {tag}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-gray-900">CAD Designer</h3>
                                    {designer.isVerified && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                            <BadgeCheck className="h-3 w-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{designer.headline}</p>
                            </div>
                        </div>
                        {designer.reviewCount > 0 && <Stars rating={designer.rating} count={designer.reviewCount} />}
                    </div>

                    {designer.bio && <p className="text-sm text-gray-600 line-clamp-2">{designer.bio}</p>}

                    <div className="flex flex-wrap gap-1.5">
                        {designer.services.slice(0, 3).map((service) => (
                            <span key={service.id} className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
                                {service.name}
                            </span>
                        ))}
                        {designer.services.length === 0 && (
                            <span className="text-[11px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                                Δεν έχει δηλώσει υπηρεσίες ακόμα
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-sm mt-auto">
                        <span className="flex items-center gap-1 text-gray-600">
                            <Timer className="h-4 w-4" /> ~{designer.avgLeadTimeDays} ημέρες
                        </span>
                        <span className="flex items-center gap-1 font-bold text-gray-900">
                            <Euro className="h-4 w-4" /> {priceFrom !== null ? `από ${euros(priceFrom)}` : "—"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> {designer.completedCases} εργασίες
                        </span>
                        {designer.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {designer.city}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

function fileIcon(kind: string) {
    if (kind === "PHOTO" || kind === "XRAY") return <Camera className="h-4 w-4 text-green-600" />
    if (kind === "INPUT_INSTRUCTION" || kind === "OUTPUT_PDF") return <Paperclip className="h-4 w-4 text-gray-500" />
    return <FileUp className="h-4 w-4 text-primary-600" />
}

export function FileRow({ file }: { file: LabCaseFileItem }) {
    return (
        <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            <span className="flex items-center gap-2 font-medium text-gray-700 min-w-0">
                {fileIcon(file.kind)}
                <span className="truncate">{file.fileName}</span>
            </span>
            <span className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400">
                    {file.kind.replace("INPUT_", "").replace("OUTPUT_", "")} · {formatBytes(file.fileSize)}
                </span>
                <FileDownloadButton fileId={file.id} fileName={file.fileName} />
            </span>
        </div>
    )
}

export function SecurityNote({ children }: { children: React.ReactNode }) {
    return (
        <p className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{children}</span>
        </p>
    )
}
