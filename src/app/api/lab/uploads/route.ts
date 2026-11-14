import { NextResponse } from "next/server"
import { getLabActor } from "@/lib/lab-domain"
import {
    createUploadSession,
    getUploadLimits,
    effectiveMaxFileSize,
    isAllowedUploadKind,
} from "@/lib/lab-uploads"
import { prisma } from "@/lib/prisma"

// The limits of the upload, so that the client never sends more than the
// host and the storage can take.
export async function GET() {
    const limits = getUploadLimits()
    return NextResponse.json({
        chunkSize: limits.chunkSize,
        maxFileSize: effectiveMaxFileSize(limits.provider),
        maxDatabaseFileSize: limits.maxDatabaseFileSize,
        provider: limits.provider,
    })
}

/** Starts a new upload session. */
export async function POST(request: Request) {
    try {
        const actor = await getLabActor()
        if (!actor) {
            return NextResponse.json({ error: "Πρέπει να είσαι συνδεδεμένος." }, { status: 401 })
        }

        const body = await request.json()
        const caseId = String(body?.caseId || "").trim() || null
        const fileName = String(body?.fileName || "").trim()
        const fileSize = Number(body?.fileSize)
        const mimeType = body?.mimeType ? String(body.mimeType) : null
        const kind = body?.kind ? String(body.kind) : null

        if (kind && !isAllowedUploadKind(kind)) {
            return NextResponse.json({ error: "Μη έγκυρος τύπος αρχείου." }, { status: 400 })
        }

        if (caseId) {
            // The same rules as the regular upload: only the customer of the
            // work, the assigned designer and the admins may upload.
            const target = await prisma.labCase.findUnique({
                where: { id: caseId },
                select: { id: true, customerId: true, assignedDesignerId: true, status: true },
            })
            if (!target) {
                return NextResponse.json({ error: "Η εργασία δεν βρέθηκε." }, { status: 404 })
            }
            const isOwner = target.customerId === actor.userId
            const isAssigned =
                !!actor.designerProfileId && target.assignedDesignerId === actor.designerProfileId
            if (!isOwner && !isAssigned && !actor.isAdmin) {
                return NextResponse.json(
                    { error: "Δεν έχεις δικαίωμα να ανεβάσεις αρχεία σε αυτή την εργασία." },
                    { status: 403 }
                )
            }
        } else if (!actor.isCustomer && !actor.isAdmin) {
            return NextResponse.json(
                { error: "Μόνο οδοντίατρες και εργαστήρια μπορούν να δημιουργήσουν εργασία." },
                { status: 403 }
            )
        }

        const session = await createUploadSession({
            userId: actor.userId,
            caseId,
            fileName,
            fileSize,
            mimeType,
            kind,
        })

        return NextResponse.json(session)
    } catch (error: any) {
        const status = error?.status ?? 400
        return NextResponse.json({ error: error?.message || "Η μεταφορά απέτυχε." }, { status })
    }
}
