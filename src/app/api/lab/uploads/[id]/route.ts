import { NextResponse } from "next/server"
import { getLabActor } from "@/lib/lab-domain"
import {
    appendUploadChunk,
    cancelUploadSession,
    completePortfolioUpload,
    completeUploadSession,
    UPLOAD_CHUNK_BYTES,
} from "@/lib/lab-uploads"
import { prisma } from "@/lib/prisma"
import { INPUT_FILE_KINDS, OUTPUT_FILE_KINDS, type LabFileKind } from "@/lib/lab"
import { getOwnPortfolioOwner } from "@/lib/lab-portfolio"
import { revalidatePath } from "next/cache"

// One chunk of a file. The body is the raw binary content of the chunk.
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const actor = await getLabActor()
        if (!actor) {
            return NextResponse.json({ error: "Πρέπει να είσαι συνδεδεμένος." }, { status: 401 })
        }

        const { id } = await params
        const url = new URL(request.url)
        const index = Number(url.searchParams.get("index"))
        const data = Buffer.from(await request.arrayBuffer())

        if (data.length > UPLOAD_CHUNK_BYTES) {
            return NextResponse.json(
                { error: "Το τμήμα του αρχείου είναι πολύ μεγάλο." },
                { status: 413 }
            )
        }

        const result = await appendUploadChunk({
            sessionId: id,
            userId: actor.userId,
            index,
            data,
        })

        return NextResponse.json(result)
    } catch (error: any) {
        const status = error?.status ?? 400
        return NextResponse.json({ error: error?.message || "Η μεταφορά απέτυχε." }, { status })
    }
}

/** Completes the upload: the file is assembled, verified and stored. */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const actor = await getLabActor()
        if (!actor) {
            return NextResponse.json({ error: "Πρέπει να είσαι συνδεδεμένος." }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json().catch(() => ({}))
        const checksum = body?.checksum ? String(body.checksum) : null
        const kind = String(body?.kind || "") as LabFileKind
        const target = String(body?.target || "case")
        const targetType = target === "portfolio" ? "portfolio" : "case"

        const session = await prisma.labUploadSession.findUnique({
            where: { id },
            select: { id: true, userId: true, caseId: true, kind: true, status: true, checksum: true },
        })
        if (!session) {
            return NextResponse.json({ error: "Η μεταφορά δεν βρέθηκε." }, { status: 404 })
        }
        if (session.userId !== actor.userId) {
            return NextResponse.json(
                { error: "Δεν έχεις δικαίωμα σε αυτή τη μεταφορά." },
                { status: 403 }
            )
        }

        // A portfolio image is not a case file: it is public and belongs to
        // the profile of the designer or of the lab.
        if (targetType === "portfolio") {
            if (session.caseId || session.kind !== "PORTFOLIO") {
                return NextResponse.json({ error: "Η μεταφορά δεν ανήκει στο portfolio." }, { status: 400 })
            }
            const ownerType = String(body?.ownerType || "DESIGNER") as "DESIGNER" | "LAB"
            if (ownerType !== "DESIGNER" && ownerType !== "LAB") {
                return NextResponse.json({ error: "Μη έγκυρος τύπος portfolio." }, { status: 400 })
            }
            const owner = await getOwnPortfolioOwner(ownerType)
            if (!owner || owner.userId !== actor.userId) {
                return NextResponse.json({ error: "Δεν έχεις δικαίωμα σε αυτό το portfolio." }, { status: 403 })
            }
            if (session.status === "COMPLETED" && checksum?.toLowerCase() === session.checksum) {
                const stored = await prisma.portfolioItem.findFirst({
                    where: {
                        id,
                        ownerType,
                        ...(ownerType === "DESIGNER" ? { designerProfileId: owner.id } : { labProfileId: owner.id }),
                        storagePath: { not: "pending" },
                    },
                    select: { id: true },
                })
                if (stored) return NextResponse.json({ itemId: stored.id, checksum: session.checksum })
            }

            const result = await completePortfolioUpload({
                sessionId: id,
                userId: actor.userId,
                checksum,
                ownerType,
                title: String(body?.title || ""),
                description: body?.description ? String(body.description) : null,
                category: body?.category ? String(body.category) : null,
            })
            revalidatePath("/lab/designer/profile")
            revalidatePath(ownerType === "DESIGNER" ? `/lab/designers/${owner.id}` : `/lab/labs/${owner.id}`)

            return NextResponse.json({ itemId: result.itemId, checksum: result.checksum })
        }

        const caseId = String(body?.caseId || session.caseId || "").trim()
        if (!caseId || caseId !== session.caseId || kind !== session.kind) {
            return NextResponse.json(
                { error: "Η μεταφορά δεν ανήκει σε εργασία." },
                { status: 400 }
            )
        }
        if (session.status === "COMPLETED" && checksum?.toLowerCase() === session.checksum) {
            const stored = await prisma.labCaseFile.findFirst({
                where: { id, caseId, uploadedById: actor.userId, storagePath: { not: "pending" } },
                select: { storageProvider: true },
            })
            if (stored) {
                return NextResponse.json({ fileId: id, checksum: session.checksum, provider: stored.storageProvider })
            }
        }

        const labCase = await prisma.labCase.findUnique({
            where: { id: caseId },
            select: { id: true, customerId: true, assignedDesignerId: true, status: true },
        })
        if (!labCase) {
            return NextResponse.json({ error: "Η εργασία δεν βρέθηκε." }, { status: 404 })
        }

        const isOwner = labCase.customerId === actor.userId
        const isAssigned =
            actor.isDesigner && !!actor.designerProfileId && labCase.assignedDesignerId === actor.designerProfileId

        // The uploader role is derived from the session, never from the client:
        // a customer cannot deliver the files of a work.
        const uploaderRole: "CUSTOMER" | "DESIGNER" =
            isAssigned && !isOwner ? "DESIGNER" : "CUSTOMER"

        if (uploaderRole === "DESIGNER") {
            if (!actor.designerProfileId) {
                return NextResponse.json(
                    { error: "Δεν έχεις δικαίωμα να παραδώσεις αρχεία." },
                    { status: 403 }
                )
            }
            if (!["ASSIGNED", "IN_PRODUCTION"].includes(labCase.status)) {
                return NextResponse.json(
                    { error: "Η εργασία δεν είναι σε κατάσταση παράδοσης." },
                    { status: 409 }
                )
            }
            if (!OUTPUT_FILE_KINDS.includes(kind)) {
                return NextResponse.json(
                    { error: "Μη έγκυρος τύπος παραδοτέου." },
                    { status: 400 }
                )
            }
        } else {
            if (!isOwner && !actor.isAdmin) {
                return NextResponse.json(
                    { error: "Δεν έχεις δικαίωμα να ανεβάσεις αρχεία σε αυτή την εργασία." },
                    { status: 403 }
                )
            }
            if (!INPUT_FILE_KINDS.includes(kind)) {
                return NextResponse.json({ error: "Μη έγκυρος τύπος αρχείου πελάτη." }, { status: 400 })
            }
        }
        if (["CANCELLED", "COMPLETED"].includes(labCase.status)) {
            return NextResponse.json({ error: "Η εργασία δεν δέχεται άλλα αρχεία." }, { status: 409 })
        }

        const result = await completeUploadSession({
            sessionId: id,
            userId: actor.userId,
            checksum,
            uploaderRole,
            kind,
            caseId,
        })
        revalidatePath(`/lab/cases/${caseId}`)

        return NextResponse.json(result)
    } catch (error: any) {
        const status = error?.status ?? 400
        return NextResponse.json({ error: error?.message || "Η αποθήκευση απέτυχε." }, { status })
    }
}

/** Cancels the upload and removes the uploaded chunks. */
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const actor = await getLabActor()
        if (!actor) {
            return NextResponse.json({ error: "Πρέπει να είσαι συνδεδεμένος." }, { status: 401 })
        }
        const { id } = await params
        await cancelUploadSession(id, actor.userId)
        return NextResponse.json({ ok: true })
    } catch (error: any) {
        const status = error?.status ?? 400
        return NextResponse.json({ error: error?.message || "Η μεταφορά απέτυχε." }, { status })
    }
}
