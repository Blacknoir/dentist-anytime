import { NextResponse } from "next/server"
import { getLabActor } from "@/lib/lab-domain"
import {
    createUploadSession,
    getUploadLimits,
    effectiveMaxFileSize,
    isAllowedUploadKind,
} from "@/lib/lab-uploads"
import { prisma } from "@/lib/prisma"
import { getOwnPortfolioOwner, MAX_PORTFOLIO_IMAGE_BYTES } from "@/lib/lab-portfolio"
import { LabActionError } from "@/lib/lab-domain"
import { INPUT_FILE_KINDS, OUTPUT_FILE_KINDS } from "@/lib/lab"

// The limits of the upload, so that the client never sends more than the
// host and the storage can take.
export async function GET() {
    const limits = getUploadLimits()
    return NextResponse.json({
        chunkSize: limits.chunkSize,
        maxFileSize: effectiveMaxFileSize(limits.provider),
        maxDatabaseFileSize: limits.maxDatabaseFileSize,
        provider: limits.provider,
        maxPortfolioImageSize: MAX_PORTFOLIO_IMAGE_BYTES,
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

        if (kind === "PORTFOLIO") {
            const ownerType = body?.ownerType
            if (caseId || (ownerType !== "DESIGNER" && ownerType !== "LAB")) {
                return NextResponse.json({ error: "Μη έγκυρη μεταφορά εικόνας portfolio." }, { status: 400 })
            }
            const owner = await getOwnPortfolioOwner(ownerType)
            if (!owner || owner.userId !== actor.userId) {
                return NextResponse.json({ error: "Δεν έχεις δικαίωμα σε αυτό το portfolio." }, { status: 403 })
            }
        } else if (caseId) {
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
                actor.isDesigner && !!actor.designerProfileId && target.assignedDesignerId === actor.designerProfileId
            if (!isOwner && !isAssigned && !actor.isAdmin) {
                return NextResponse.json(
                    { error: "Δεν έχεις δικαίωμα να ανεβάσεις αρχεία σε αυτή την εργασία." },
                    { status: 403 }
                )
            }
            const allowed = isAssigned && !isOwner ? OUTPUT_FILE_KINDS : INPUT_FILE_KINDS
            if (!kind || !allowed.includes(kind as (typeof allowed)[number])) {
                return NextResponse.json({ error: "Μη έγκυρος τύπος αρχείου για αυτή την εργασία." }, { status: 400 })
            }
            if (["CANCELLED", "COMPLETED"].includes(target.status) ||
                (isAssigned && !isOwner && !["ASSIGNED", "IN_PRODUCTION"].includes(target.status))) {
                return NextResponse.json({ error: "Η εργασία δεν δέχεται άλλα αρχεία." }, { status: 409 })
            }
        } else {
            return NextResponse.json(
                { error: "Δημιούργησε πρώτα την εργασία για να ανεβάσεις αρχεία." },
                { status: 400 }
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
    } catch (error) {
        if (error instanceof LabActionError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }
        console.error("[lab] Could not start upload:", error)
        return NextResponse.json({ error: "Η μεταφορά δεν ξεκίνησε. Δοκίμασε ξανά." }, { status: 500 })
    }
}
