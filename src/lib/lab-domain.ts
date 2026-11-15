// Server-only core of the Lab marketplace.
//
// Everything that must never be reachable from the browser lives here:
//   - the actor/consent checks,
//   - the payment mutations (releasing money, marking a payment as held),
//   - the state machines of the case/offer lifecycle.
//
// The "use server" modules in src/app/actions only expose thin, authorised
// wrappers around these functions. A file level "use server" directive turns
// *every* export into a public POST endpoint, so the dangerous primitives must
// not be exported from there.

import "server-only"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { publicCodeFor } from "@/lib/lab"

export type LabActor = {
    userId: string
    role: string
    name: string
    email: string
    publicCode: string
    designerProfileId: string | null
    isCustomer: boolean
    isDesigner: boolean
    isAdmin: boolean
}

/**
 * A business error with a stable code. The client shows `message` and can
 * react to `code` (for example to send the user to the consent page).
 */
export class LabActionError extends Error {
    code: string
    status: number

    constructor(code: string, message: string, status = 400) {
        super(message)
        this.name = "LabActionError"
        this.code = code
        this.status = status
    }
}

export function toActionError(error: unknown): { code: string; message: string; status: number } {
    if (error instanceof LabActionError) {
        return { code: error.code, message: error.message, status: error.status }
    }
    if (error instanceof Error) {
        return { code: "UNKNOWN", message: error.message, status: 400 }
    }
    return { code: "UNKNOWN", message: "Η ενέργεια απέτυχε.", status: 400 }
}

/** Returns the signed in lab actor, or null when there is no usable session. */
export async function getLabActor(): Promise<LabActor | null> {
    const session = await auth()
    if (!session?.user?.id) return null

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            publicCode: true,
            designerProfile: { select: { id: true } },
        },
    })
    if (!user) return null

    const role = user.role || "PATIENT"

    return {
        userId: user.id,
        role,
        name: user.name || "",
        email: user.email || "",
        publicCode: publicCodeFor(user),
        designerProfileId: user.designerProfile?.id ?? null,
        isCustomer: role === "DENTIST" || role === "LAB",
        isDesigner: role === "DESIGNER" && !!user.designerProfile,
        isAdmin: role === "ADMIN",
    }
}

export async function requireLabActor(): Promise<LabActor> {
    const actor = await getLabActor()
    if (!actor) {
        throw new LabActionError("UNAUTHENTICATED", "Πρέπει να είσαι συνδεδεμένος για αυτή τη δράση.", 401)
    }
    return actor
}

export const REQUIRED_LAB_CONSENT_KEYS = ["TERMS", "DPA", "PRIVACY"] as const

/** The consent documents the user has not accepted yet (latest version). */
export async function missingLabConsents(userId: string): Promise<string[]> {
    const documents = await prisma.legalDocument.findMany()
    const latest = new Map<string, (typeof documents)[number]>()
    for (const document of documents) {
        const current = latest.get(document.key)
        if (!current || document.effectiveAt > current.effectiveAt) latest.set(document.key, document)
    }

    const consents = await prisma.documentConsent.findMany({
        where: { userId, scope: "LAB" },
        select: { documentKey: true, documentVersion: true, documentHash: true },
    })

    return REQUIRED_LAB_CONSENT_KEYS.filter((key) => {
        const document = latest.get(key)
        if (!document) return true
        return !consents.some(
            (consent) =>
                consent.documentKey === key &&
                consent.documentVersion === document.version &&
                consent.documentHash === document.contentHash
        )
    })
}

/**
 * Throws a structured error that points the user to the consent page when a
 * mandatory document is missing.
 */
export async function assertLabConsents(userId: string) {
    const missing = await missingLabConsents(userId)
    if (missing.length > 0) {
        throw new LabActionError(
            "CONSENTS_MISSING",
            "Πρέπει να αποδεχτείς τα υποχρεωτικά έγγραφα (Όροι χρήσης, Σύμβαση Επεξεργασίας Δεδομένων, Πολιτική Απορρήτου) στη σελίδα /lab/legal/consent.",
            403
        )
    }
}

export async function getLabCaseById(id: string) {
    return prisma.labCase.findUnique({
        where: { id },
        include: {
            // The customer name is only rendered for the owner and the admins.
            customer: { select: { id: true, publicCode: true, role: true, name: true } },
            assignedDesigner: {
                include: {
                    // The designer identity stays anonymous for everyone else.
                    user: { select: { id: true, publicCode: true, image: true } },
                    services: { where: { isActive: true } },
                },
            },
            files: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true, kind: true, fileName: true, fileSize: true, storagePath: true,
                    uploaderRole: true, submittedAt: true,
                },
            },
            offers: {
                orderBy: { price: "asc" },
                include: {
                    designerProfile: {
                        include: { user: { select: { id: true, publicCode: true, image: true } } },
                    },
                },
            },
            revisions: { orderBy: { createdAt: "desc" } },
        },
    })
}
