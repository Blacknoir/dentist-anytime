"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getLabActor } from "@/app/actions/lab"
import {
    decryptBuffer,
    encryptBuffer,
    randomId,
    sha256,
    signPayload,
} from "@/lib/lab-crypto"
import { LAB_LEGAL_DOCUMENTS, REQUIRED_LAB_CONSENTS } from "@/lib/lab-legal"
import {
    buildOtpAuthUrl,
    generateBase32Secret,
    generateRecoveryCodes,
    verifyTotp,
} from "@/lib/totp"

const TWO_FACTOR_COOKIE = "lab_2fa_grant"
const TWO_FACTOR_GRANT_MINUTES = 10

async function requestContext() {
    const headerList = await headers()
    const ipAddress =
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerList.get("x-real-ip") ||
        null
    const userAgent = headerList.get("user-agent") || null
    return { ipAddress, userAgent }
}

export async function ensureLegalDocuments() {
    for (const definition of LAB_LEGAL_DOCUMENTS) {
        await prisma.legalDocument.upsert({
            where: { key_version: { key: definition.key, version: definition.version } },
            update: { body: definition.body, title: definition.title, contentHash: sha256(definition.body) },
            create: {
                key: definition.key,
                title: definition.title,
                version: definition.version,
                body: definition.body,
                contentHash: sha256(definition.body),
                isRequired: true,
            },
        })
    }
}

export async function getLegalDocuments() {
    await ensureLegalDocuments()
    return prisma.legalDocument.findMany({ orderBy: { key: "asc" } })
}

export async function getLegalDocumentByKey(key: string) {
    await ensureLegalDocuments()
    return prisma.legalDocument.findFirst({
        where: { key },
        orderBy: { effectiveAt: "desc" },
    })
}

export async function getMyConsents() {
    const actor = await getLabActor()
    if (!actor) return []

    const consents = await prisma.documentConsent.findMany({
        where: { userId: actor.userId, scope: "LAB" },
        orderBy: { acceptedAt: "desc" },
    })

    const documents = await prisma.legalDocument.findMany()
    const latest = new Map<string, (typeof documents)[number]>()
    for (const document of documents) {
        const current = latest.get(document.key)
        if (!current || document.effectiveAt > current.effectiveAt) latest.set(document.key, document)
    }

    return consents.map((consent) => ({
        ...consent,
        isCurrentVersion: latest.get(consent.documentKey)?.version === consent.documentVersion,
        documentTitle: latest.get(consent.documentKey)?.title || consent.documentKey,
    }))
}

export async function getMissingConsents() {
    const actor = await getLabActor()
    if (!actor) return REQUIRED_LAB_CONSENTS

    const documents = await prisma.legalDocument.findMany()
    const latest = new Map<string, (typeof documents)[number]>()
    for (const document of documents) {
        const current = latest.get(document.key)
        if (!current || document.effectiveAt > current.effectiveAt) latest.set(document.key, document)
    }

    const consents = await prisma.documentConsent.findMany({
        where: { userId: actor.userId, scope: "LAB" },
    })

    return REQUIRED_LAB_CONSENTS.filter((key) => {
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

export async function recordLabConsents(accepted: Record<string, boolean>) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος για να αποδεχείς τους όρους.")

    const missing = REQUIRED_LAB_CONSENTS.filter((key) => !accepted[key])
    if (missing.length > 0) {
        throw new Error("Πρέπει να αποδεχτείς όλα τα υποχρεωτικά έγγραφα.")
    }

    await ensureLegalDocuments()
    const { ipAddress, userAgent } = await requestContext()

    for (const key of REQUIRED_LAB_CONSENTS) {
        const definition = LAB_LEGAL_DOCUMENTS.find((document) => document.key === key)
        if (!definition) continue

        const document = await prisma.legalDocument.findUnique({
            where: { key_version: { key, version: definition.version } },
        })
        if (!document) continue

        const alreadyAccepted = await prisma.documentConsent.findFirst({
            where: {
                userId: actor.userId,
                documentKey: key,
                documentVersion: document.version,
                documentHash: document.contentHash,
                scope: "LAB",
            },
        })
        if (alreadyAccepted) continue

        await prisma.documentConsent.create({
            data: {
                evidenceId: randomId("EV"),
                userId: actor.userId,
                documentKey: key,
                documentVersion: document.version,
                documentHash: document.contentHash,
                scope: "LAB",
                ipAddress,
                userAgent,
            },
        })

        await prisma.auditEvent.create({
            data: {
                actorUserId: actor.userId,
                action: "CONSENT_ACCEPTED",
                entity: "LegalDocument",
                entityId: document.id,
                metadata: JSON.stringify({ key, version: document.version }),
                ipAddress,
                userAgent,
            },
        })
    }

    revalidatePath("/lab/legal/consents")
    revalidatePath("/lab")
    return { ok: true }
}

export async function buildConsentEvidence(evidenceId: string) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Unauthorized")

    const consent = await prisma.documentConsent.findUnique({
        where: { evidenceId },
        include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!consent) throw new Error("Το αποδεικτικό δεν βρέθηκε.")
    if (consent.userId !== actor.userId && !actor.isAdmin) {
        throw new Error("Unauthorized")
    }

    const document = await prisma.legalDocument.findFirst({
        where: { key: consent.documentKey, version: consent.documentVersion },
    })

    const payload = [
        "DENTORA-LAB-CONSENT-EVIDENCE",
        consent.evidenceId,
        consent.userId,
        consent.documentKey,
        consent.documentVersion,
        consent.documentHash,
        consent.acceptedAt.toISOString(),
        consent.ipAddress || "",
    ].join("|")

    return {
        evidenceId: consent.evidenceId,
        userId: consent.userId,
        userName: consent.user.name,
        userEmail: consent.user.email,
        documentKey: consent.documentKey,
        documentTitle: document?.title || consent.documentKey,
        documentVersion: consent.documentVersion,
        documentHash: consent.documentHash,
        acceptedAt: consent.acceptedAt,
        ipAddress: consent.ipAddress,
        signature: signPayload(payload),
    }
}

export async function verifyConsentEvidence(evidenceId: string, signature: string) {
    const consent = await prisma.documentConsent.findUnique({ where: { evidenceId } })
    if (!consent) return { valid: false, reason: "Το αποδεικτικό δεν βρέθηκε." }

    const payload = [
        "DENTORA-LAB-CONSENT-EVIDENCE",
        consent.evidenceId,
        consent.userId,
        consent.documentKey,
        consent.documentVersion,
        consent.documentHash,
        consent.acceptedAt.toISOString(),
        consent.ipAddress || "",
    ].join("|")

    const expected = signPayload(payload)
    const valid = expected.length === signature.length && expected === signature

    return {
        valid,
        reason: valid ? undefined : "Η υπογραφή δεν ταιριάζει.",
        evidenceId: consent.evidenceId,
        documentKey: consent.documentKey,
        documentVersion: consent.documentVersion,
        acceptedAt: consent.acceptedAt,
    }
}

// ---------------------------------------------------------------- verification

export async function submitVerificationRequest(input: { notes?: string; documentName?: string }) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const subjectType = actor.role === "DESIGNER" ? "DESIGNER" : actor.role === "DENTIST" ? "DENTIST" : null
    if (!subjectType) throw new Error("Η επαλήθευση επαγγέλματος είναι διαθέσιμη μόνο για οδοντίατρες και designers.")

    const existing = await prisma.verificationRequest.findFirst({
        where: { userId: actor.userId, status: "PENDING" },
    })
    if (existing) throw new Error("Έχει ήδη υπάρχει εκκρεμής αίτηση επαλήθευσης.")

    const { ipAddress, userAgent } = await requestContext()
    const request = await prisma.verificationRequest.create({
        data: {
            userId: actor.userId,
            subjectType,
            notes: input.notes || null,
            documentName: input.documentName || null,
        },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "VERIFICATION_REQUESTED",
            entity: "VerificationRequest",
            entityId: request.id,
            metadata: JSON.stringify({ subjectType }),
            ipAddress,
            userAgent,
        },
    })

    revalidatePath("/lab/verification")
    return { ok: true, id: request.id }
}

export async function getMyVerificationRequest() {
    const actor = await getLabActor()
    if (!actor) return null
    return prisma.verificationRequest.findFirst({
        where: { userId: actor.userId },
        orderBy: { createdAt: "desc" },
    })
}

export async function listVerificationRequests(status?: string) {
    const actor = await getLabActor()
    if (!actor?.isAdmin) return []

    return prisma.verificationRequest.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
    })
}

export async function reviewVerificationRequest(
    id: string,
    decision: "APPROVED" | "REJECTED",
    reviewNotes?: string
) {
    const actor = await getLabActor()
    if (!actor?.isAdmin) throw new Error("Unauthorized")

    const request = await prisma.verificationRequest.findUnique({ where: { id } })
    if (!request) throw new Error("Η αίτηση δεν βρέθηκε.")

    const { ipAddress, userAgent } = await requestContext()

    await prisma.verificationRequest.update({
        where: { id },
        data: {
            status: decision,
            reviewNotes: reviewNotes || null,
            reviewedById: actor.userId,
            reviewedAt: new Date(),
        },
    })

    if (request.subjectType === "DESIGNER") {
        await prisma.designerProfile.updateMany({
            where: { userId: request.userId },
            data: { isVerified: decision === "APPROVED" },
        })
    } else {
        await prisma.dentistProfile.updateMany({
            where: { userId: request.userId },
            data: { isVerified: decision === "APPROVED" },
        })
    }

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: `VERIFICATION_${decision}`,
            entity: "VerificationRequest",
            entityId: id,
            metadata: JSON.stringify({ userId: request.userId }),
            ipAddress,
            userAgent,
        },
    })

    revalidatePath("/lab/admin")
    return { ok: true }
}

// ---------------------------------------------------------------- audit & logs

export async function recordFileAccess(input: {
    fileId?: string
    caseId?: string
    action: string
    outcome?: "ALLOWED" | "DENIED"
    userId?: string
    metadata?: Record<string, unknown>
}) {
    const { ipAddress, userAgent } = await requestContext()
    await prisma.fileAccessLog.create({
        data: {
            fileId: input.fileId ?? null,
            caseId: input.caseId ?? null,
            userId: input.userId ?? null,
            action: input.action,
            outcome: input.outcome ?? "ALLOWED",
            ipAddress,
            userAgent,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        },
    })
}

export async function listFileAccessLogs(input: { caseId?: string; fileId?: string; limit?: number }) {
    const actor = await getLabActor()
    if (!actor) return []

    const where: Record<string, any> = {}
    if (input.caseId) where.caseId = input.caseId
    if (input.fileId) where.fileId = input.fileId

    if (!actor.isAdmin) {
        const ownCases = await prisma.labCase.findMany({
            where: {
                OR: [
                    { customerId: actor.userId },
                    ...(actor.designerProfileId ? [{ assignedDesignerId: actor.designerProfileId }] : []),
                ],
            },
            select: { id: true },
        })
        const allowedIds = ownCases.map((item) => item.id)
        where.OR = [
            { caseId: { in: allowedIds } },
            { userId: actor.userId },
        ]
    }

    return prisma.fileAccessLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit ?? 100,
    })
}

export async function listAuditEvents(limit = 100) {
    const actor = await getLabActor()
    if (!actor?.isAdmin) return []
    return prisma.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: limit })
}

// ---------------------------------------------------------------- incidents

export async function reportSecurityIncident(input: {
    title: string
    severity: string
    description: string
    contactEmail?: string
    affectedData?: string
}) {
    const actor = await getLabActor()
    const title = (input.title || "").trim()
    const description = (input.description || "").trim()
    if (title.length < 5) throw new Error("Περιέγραψε σύντομα το περιστατικό.")
    if (description.length < 20) throw new Error("Πρόσθεσε λεπτομέρειες (τουλάχιστον 20 χαρακτήρες).")

    const { ipAddress, userAgent } = await requestContext()
    const reference = `DLA-${new Date().getFullYear()}-${randomId("").slice(1, 7)}`

    const incident = await prisma.securityIncident.create({
        data: {
            reference,
            title,
            severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(input.severity)
                ? input.severity
                : "MEDIUM",
            description,
            contactEmail: input.contactEmail || actor?.email || null,
            affectedData: input.affectedData || null,
        },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor?.userId ?? null,
            action: "SECURITY_INCIDENT_REPORTED",
            entity: "SecurityIncident",
            entityId: incident.id,
            metadata: JSON.stringify({ reference }),
            ipAddress,
            userAgent,
        },
    })

    revalidatePath("/lab/security")
    return { ok: true, reference }
}

export async function listSecurityIncidents() {
    return prisma.securityIncident.findMany({
        orderBy: { reportedAt: "desc" },
        take: 50,
        select: {
            id: true,
            reference: true,
            title: true,
            severity: true,
            status: true,
            publicSummary: true,
            reportedAt: true,
            resolvedAt: true,
            affectedData: true,
        },
    })
}

export async function updateSecurityIncident(id: string, status: string, publicSummary?: string) {
    const actor = await getLabActor()
    if (!actor?.isAdmin) throw new Error("Unauthorized")

    await prisma.securityIncident.update({
        where: { id },
        data: {
            status,
            publicSummary: publicSummary ?? null,
            resolvedAt: status === "RESOLVED" || status === "DISCLOSED" ? new Date() : null,
        },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "SECURITY_INCIDENT_UPDATED",
            entity: "SecurityIncident",
            entityId: id,
            metadata: JSON.stringify({ status }),
        },
    })

    revalidatePath("/lab/security")
    return { ok: true }
}

// ---------------------------------------------------------------- deletion

export async function requestDataDeletion(input: { scope?: string; reason?: string }) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const request = await prisma.dataDeletionRequest.create({
        data: {
            userId: actor.userId,
            scope: input.scope === "ALL" ? "ALL" : "LAB_DATA",
            reason: input.reason || null,
            dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "DELETION_REQUESTED",
            entity: "DataDeletionRequest",
            entityId: request.id,
        },
    })

    revalidatePath("/lab/legal/retention")
    return { ok: true, id: request.id }
}

export async function listDeletionRequests() {
    const actor = await getLabActor()
    if (!actor?.isAdmin) return []
    return prisma.dataDeletionRequest.findMany({
        orderBy: { requestedAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
    })
}

export async function executeDeletionRequest(id: string) {
    const actor = await getLabActor()
    if (!actor?.isAdmin) throw new Error("Unauthorized")

    const request = await prisma.dataDeletionRequest.findUnique({ where: { id } })
    if (!request) throw new Error("Το αίτημα δεν βρέθηκε.")

    const cases = await prisma.labCase.findMany({
        where: { customerId: request.userId },
        select: { id: true },
    })
    const caseIds = cases.map((item) => item.id)

    const files = await prisma.labCaseFile.findMany({
        where: { caseId: { in: caseIds } },
        select: { id: true, storagePath: true, storageProvider: true },
    })

    const { deleteLabFile } = await import("@/lib/lab-storage")
    for (const file of files) {
        await deleteLabFile(
            file.storagePath,
            file.storageProvider as "blob" | "local" | "db",
            file.id
        ).catch(() => undefined)
    }

    await prisma.labCase.deleteMany({ where: { customerId: request.userId } })
    await prisma.labOffer.deleteMany({ where: { designerProfile: { userId: request.userId } } })
    await prisma.caseRevision.deleteMany({ where: { requestedById: request.userId } })

    await prisma.dataDeletionRequest.update({
        where: { id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            report: JSON.stringify({
                deletedCases: caseIds.length,
                deletedFiles: files.length,
                backups: "Τα backups διαγράφονται αυτόματα στον κύκλο ζωής τους (30 ημέρες).",
                retainedAudit: "Οι εγγραφές ελέγχου/αποδείξεις συγκατάθεσης διατηρούνται για 5 έτη (νομική υποχρέωση).",
            }),
        },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "DELETION_EXECUTED",
            entity: "DataDeletionRequest",
            entityId: id,
            metadata: JSON.stringify({ deletedCases: caseIds.length, deletedFiles: files.length }),
        },
    })

    revalidatePath("/lab/admin")
    return { ok: true }
}

// ---------------------------------------------------------------- 2FA

export async function startTwoFactorEnrollment() {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const secret = generateBase32Secret()
    const encrypted = encryptBuffer(Buffer.from(secret)).toString("base64")

    await prisma.user.update({
        where: { id: actor.userId },
        data: { twoFactorSecret: encrypted, twoFactorEnabled: false },
    })

    return {
        secret,
        otpauthUrl: buildOtpAuthUrl("Dentora Lab", actor.email || actor.userId, secret),
    }
}

export async function confirmTwoFactorEnrollment(code: string) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { twoFactorSecret: true },
    })
    if (!user?.twoFactorSecret) throw new Error("Ξεκίνα πρώτα την ενεργοποίηση του 2FA.")

    const secret = decryptSecret(user.twoFactorSecret)
    if (!verifyTotp(secret, code)) throw new Error("Λανθασμένος κωδικός.")

    const recoveryCodes = generateRecoveryCodes()
    const hashed = recoveryCodes.map((recovery) => sha256(recovery))

    await prisma.user.update({
        where: { id: actor.userId },
        data: { twoFactorEnabled: true, twoFactorRecoveryCodes: JSON.stringify(hashed) },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "TWO_FACTOR_ENABLED",
            entity: "User",
            entityId: actor.userId,
        },
    })

    return { ok: true, recoveryCodes }
}

export async function disableTwoFactor(code: string) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorRecoveryCodes: true },
    })
    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new Error("Το 2FA δεν είναι ενεργοποιημένο.")
    }

    const secret = decryptSecret(user.twoFactorSecret)
    let valid = verifyTotp(secret, code)

    if (!valid && user.twoFactorRecoveryCodes) {
        const hashes = JSON.parse(user.twoFactorRecoveryCodes) as string[]
        const hash = sha256((code || "").trim().toUpperCase())
        if (hashes.includes(hash)) {
            valid = true
            await prisma.user.update({
                where: { id: actor.userId },
                data: {
                    twoFactorRecoveryCodes: JSON.stringify(hashes.filter((item) => item !== hash)),
                },
            })
        }
    }

    if (!valid) throw new Error("Λανθασμένος κωδικός.")

    await prisma.user.update({
        where: { id: actor.userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: null },
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "TWO_FACTOR_DISABLED",
            entity: "User",
            entityId: actor.userId,
        },
    })

    return { ok: true }
}

export async function verifyTwoFactor(code: string) {
    const actor = await getLabActor()
    if (!actor) throw new Error("Πρέπει να είσαι συνδεδεμένος.")

    const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorRecoveryCodes: true },
    })
    if (!user?.twoFactorEnabled) return { ok: true, required: false }
    if (!user.twoFactorSecret) throw new Error("Το 2FA δεν έχει ρυθμιστεί σωστά.")

    const secret = decryptSecret(user.twoFactorSecret)
    let valid = verifyTotp(secret, code)

    if (!valid && user.twoFactorRecoveryCodes) {
        const hashes = JSON.parse(user.twoFactorRecoveryCodes) as string[]
        const hash = sha256((code || "").trim().toUpperCase())
        if (hashes.includes(hash)) {
            valid = true
            await prisma.user.update({
                where: { id: actor.userId },
                data: {
                    twoFactorRecoveryCodes: JSON.stringify(hashes.filter((item) => item !== hash)),
                },
            })
        }
    }

    if (!valid) throw new Error("Λανθασμένος κωδικός 2FA.")

    const grant = signPayload(
        `2FA|${actor.userId}|${Date.now() + TWO_FACTOR_GRANT_MINUTES * 60 * 1000}`
    )
    const expires = Date.now() + TWO_FACTOR_GRANT_MINUTES * 60 * 1000
    const cookieStore = await cookies()
    cookieStore.set(TWO_FACTOR_COOKIE, `${actor.userId}.${expires}.${grant}`, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: TWO_FACTOR_GRANT_MINUTES * 60,
    })

    await prisma.auditEvent.create({
        data: {
            actorUserId: actor.userId,
            action: "TWO_FACTOR_VERIFIED",
            entity: "User",
            entityId: actor.userId,
        },
    })

    return { ok: true, required: true }
}

export async function hasTwoFactorGrant(userId: string) {
    const cookieStore = await cookies()
    const value = cookieStore.get(TWO_FACTOR_COOKIE)?.value
    if (!value) return false
    const [cookieUserId, expires, signature] = value.split(".")
    if (!cookieUserId || !expires || !signature) return false
    if (cookieUserId !== userId) return false
    if (Number(expires) < Date.now()) return false
    return signPayload(`2FA|${cookieUserId}|${expires}`) === signature
}

export async function getTwoFactorStatus() {
    const actor = await getLabActor()
    if (!actor) return { enabled: false }
    const user = await prisma.user.findUnique({
        where: { id: actor.userId },
        select: { twoFactorEnabled: true },
    })
    return { enabled: !!user?.twoFactorEnabled }
}

function decryptSecret(encrypted: string) {
    return decryptBuffer(Buffer.from(encrypted, "base64")).toString("utf8")
}
