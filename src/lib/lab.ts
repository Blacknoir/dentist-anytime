// Shared types, constants and helpers for the Lab (CAD design) marketplace.
// Only used inside /lab — the main booking site is untouched.

import { createHash } from "crypto"
import type { Prisma } from "@prisma/client"

export const LAB_PLATFORM_FEE_RATE = 10 // % kept by the platform on every CAD job

// ------------------------------------------------------------------ anonymity
// The marketplace never exposes the real name of a party to its counterpart:
// customers only see an anonymous code so that deals cannot be closed outside
// the platform. The real identity stays available to the platform admins.

export const PARTY_CODE_PREFIX: Record<string, string> = {
    DENTIST: "DN",
    LAB: "LB",
    DESIGNER: "CD",
    PATIENT: "PT",
    ADMIN: "AD",
}

export const PARTY_ROLE_LABEL: Record<string, string> = {
    DENTIST: "Οδοντίατρος",
    LAB: "Εργαστήριο",
    DESIGNER: "CAD Designer",
    PATIENT: "Χρήστης",
    ADMIN: "Διαχειριστής",
}

/** Deterministic fallback code when a row has none (never exposes a name). */
export function derivePublicCode(id: string, role: string) {
    const prefix = PARTY_CODE_PREFIX[role] ?? "US"
    const hash = createHash("sha256").update(id).digest("hex").toUpperCase()
    return `${prefix}-${hash.slice(0, 4)}`
}

export function publicCodeFor(user: {
    id: string
    role?: string | null
    publicCode?: string | null
}) {
    return user.publicCode || derivePublicCode(user.id, user.role || "PATIENT")
}

/** "CAD Designer #CD-9134" — the label a counterpart sees. */
export function partyLabel(user: { id: string; role?: string | null; publicCode?: string | null }) {
    const role = user.role || "PATIENT"
    const label = PARTY_ROLE_LABEL[role] ?? "Επαγγελματίας"
    return `${label} #${publicCodeFor(user)}`
}

/** Two-letter avatar tag derived from the anonymous code (never from a name). */
export function codeInitials(code?: string | null) {
    if (!code) return "··"
    return code.replace("-", "").slice(0, 2).toUpperCase()
}

/**
 * Removes contact details from free-text messages so that parties cannot
 * exchange phone numbers / emails and close a deal outside the platform.
 */
export function redactContactDetails(text: string) {
    if (!text) return text
    let output = text.replace(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g, "[email αποκρύφτηκε]")
    output = output.replace(/(?:\+?\d[\d\s().\-/]{6,}\d)/g, (match) => {
        const digits = match.replace(/\D/g, "")
        return digits.length >= 9 ? "[τηλέφωνο αποκρύφτηκε]" : match
    })
    return output
}

export type LabCaseListItem = Prisma.LabCaseGetPayload<{
    include: {
        customer: { select: { id: true; publicCode: true; role: true } }
        assignedDesigner: { select: { id: true; user: { select: { publicCode: true } } } }
        _count: { select: { files: true; offers: true; revisions: true } }
    }
}>

export type LabCaseDetail = Prisma.LabCaseGetPayload<{
    include: {
        customer: { select: { id: true; publicCode: true; role: true; name: true } }
        assignedDesigner: {
            include: {
                user: { select: { id: true; publicCode: true; image: true } }
                services: { where: { isActive: true } }
            }
        }
        files: true
        offers: {
            include: {
                designerProfile: { include: { user: { select: { id: true; publicCode: true; image: true } } } }
            }
        }
        revisions: true
    }
}>

export type LabCaseFileItem = Prisma.LabCaseFileGetPayload<{}>

export type DesignerListItem = Prisma.DesignerProfileGetPayload<{
    include: {
        user: { select: { id: true; publicCode: true; image: true } }
        services: { where: { isActive: true } }
    }
}>

export type LabProfileListItem = Prisma.LabProfileGetPayload<{
    include: { user: { select: { id: true; publicCode: true } } }
}>

export const LAB_CASE_STATUSES = [
    "OPEN",
    "QUOTED",
    "ASSIGNED",
    "IN_PRODUCTION",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
] as const

export type LabCaseStatus = (typeof LAB_CASE_STATUSES)[number]

export const STATUS_META: Record<LabCaseStatus, { label: string; classes: string }> = {
    OPEN: { label: "Ανοιχτή", classes: "bg-blue-50 text-blue-700 border-blue-200" },
    QUOTED: { label: "Με προσφορές", classes: "bg-amber-50 text-amber-700 border-amber-200" },
    ASSIGNED: { label: "Ανατέθηκε", classes: "bg-violet-50 text-violet-700 border-violet-200" },
    IN_PRODUCTION: { label: "Σε εξέλιξη", classes: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    DELIVERED: { label: "Παραδόθηκε", classes: "bg-teal-50 text-teal-700 border-teal-200" },
    COMPLETED: { label: "Ολοκληρώθηκε", classes: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: { label: "Ακυρώθηκε", classes: "bg-gray-100 text-gray-600 border-gray-200" },
}

export const PAYMENT_STATUS_META: Record<string, { label: string; classes: string }> = {
    UNPAID: { label: "Απλήρωτη", classes: "bg-gray-100 text-gray-600 border-gray-200" },
    HELD: { label: "Σε ασφάλεια (escrow)", classes: "bg-amber-50 text-amber-700 border-amber-200" },
    RELEASED: { label: "Πληρωμή στον designer", classes: "bg-green-50 text-green-700 border-green-200" },
    REFUNDED: { label: "Επιστροφή", classes: "bg-blue-50 text-blue-700 border-blue-200" },
    FAILED: { label: "Απέτυχε", classes: "bg-red-50 text-red-700 border-red-200" },
}

export const FILE_KINDS = {
    INPUT_STL: { label: "STL (σάρωση)", icon: "STL" },
    INPUT_INSTRUCTION: { label: "Οδηγίες σχεδιασμού", icon: "DOC" },
    PHOTO: { label: "Φωτογραφία", icon: "IMG" },
    XRAY: { label: "Ακτινογραφία", icon: "IMG" },
    OUTPUT_STL: { label: "Ολοκληρωμένο STL", icon: "STL" },
    OUTPUT_PDF: { label: "Ολοκληρωμένο PDF", icon: "DOC" },
} as const

export type LabFileKind = keyof typeof FILE_KINDS

export const INPUT_FILE_KINDS: LabFileKind[] = ["INPUT_STL", "INPUT_INSTRUCTION", "PHOTO", "XRAY"]
export const OUTPUT_FILE_KINDS: LabFileKind[] = ["OUTPUT_STL", "OUTPUT_PDF"]

export const WORK_TYPES = [
    "Στεφάνη",
    "Γέφυρα",
    "Ένθετο/Επένθετο",
    "Όψη",
    "Ολική Οδοντοστοιχία",
    "Μερική Οδοντοστοιχία",
    "Νάρθηκας",
    "Εμφυτευματική εργασία",
    "Νάρθηκας ορθοδοντικής",
] as const

export const MATERIALS = [
    "Zirconia monolithic",
    "Zirconia layered",
    "e.max",
    "PMMA",
    "Metal-Ceramic",
    "Titanium",
    "Resin printed",
    "Flexible",
] as const

export const SHADES = ["A1", "A2", "A3", "A3.5", "B1", "B2", "BL2", "C2", "—"] as const

export const PRIORITIES = [
    { value: "STANDARD", label: "Standard" },
    { value: "EXPRESS", label: "Express" },
] as const

/** Splits the agreed price into platform fee + designer payout (both in EUR). */
export function computeSplit(price: number, feeRate: number = LAB_PLATFORM_FEE_RATE) {
    const fee = Math.round(price * feeRate) / 100
    const payout = Math.round((price - fee) * 100) / 100
    return { fee, payout, feeRate }
}

export function euros(value: number | null | undefined) {
    if (value === null || value === undefined) return "—"
    return new Intl.NumberFormat("el-GR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value)
}

/** Human readable case code, e.g. LAB-2026-0142 */
export function generateCaseCode() {
    const year = new Date().getFullYear()
    const digits = Math.floor(1000 + Math.random() * 9000)
    return `LAB-${year}-${digits}`
}

export function formatDate(value: Date | string | null | undefined) {
    if (!value) return "—"
    const date = typeof value === "string" ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return "—"
    return new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "short", year: "numeric" }).format(date)
}

export function formatDateTime(value: Date | string | null | undefined) {
    if (!value) return "—"
    const date = typeof value === "string" ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return "—"
    return new Intl.DateTimeFormat("el-GR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date)
}

export function formatBytes(bytes: number) {
    if (!bytes) return "0 B"
    const units = ["B", "KB", "MB", "GB"]
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function initials(name?: string | null) {
    if (!name) return "CD"
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
}

/** Guesses the file kind from the extension when the client does not send one. */
export function inferFileKind(fileName: string, fallback: LabFileKind): LabFileKind {
    const lower = fileName.toLowerCase()
    if (lower.endsWith(".stl") || lower.endsWith(".obj") || lower.endsWith(".3mf") || lower.endsWith(".zip") || lower.endsWith(".step") || lower.endsWith(".stp")) {
        return fallback === "OUTPUT_PDF" ? "OUTPUT_STL" : "INPUT_STL"
    }
    if (lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx") || lower.endsWith(".txt")) {
        return fallback === "OUTPUT_PDF" ? "OUTPUT_PDF" : "INPUT_INSTRUCTION"
    }
    if (lower.endsWith(".dcm")) return "XRAY"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return "PHOTO"
    return fallback
}
