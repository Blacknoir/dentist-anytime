import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { readLabFile, sanitizeFileName } from "@/lib/lab-storage"
import { hasTwoFactorGrant, recordFileAccess } from "@/app/actions/lab-compliance"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const headerList = await headers()
    const ipAddress =
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || null
    const userAgent = headerList.get("user-agent") || null

    const file = await prisma.labCaseFile.findUnique({
        where: { id },
        include: {
            case: {
                select: {
                    customerId: true,
                    assignedDesignerId: true,
                    status: true,
                },
            },
        },
    })

    if (!file) {
        await recordFileAccess({
            fileId: id,
            action: "DOWNLOAD",
            outcome: "DENIED",
            userId: session.user.id,
            metadata: { reason: "not_found" },
        })
        return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, twoFactorEnabled: true, designerProfile: { select: { id: true } } },
    })

    const designerProfileId = user?.designerProfile?.id ?? null
    const isOwner = file.case.customerId === session.user.id
    const isAssignedDesigner = !!designerProfileId && file.case.assignedDesignerId === designerProfileId
    const isAdmin = user?.role === "ADMIN"

    // Only the case owner, the designer the work was assigned to and
    // authorised compliance officers may open case files.
    if (!isOwner && !isAssignedDesigner && !isAdmin) {
        await recordFileAccess({
            fileId: file.id,
            caseId: file.caseId,
            action: "DOWNLOAD",
            outcome: "DENIED",
            userId: session.user.id,
            metadata: { reason: "not_authorised", ipAddress, userAgent },
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (user?.twoFactorEnabled) {
        const granted = await hasTwoFactorGrant(session.user.id)
        if (!granted) {
            await recordFileAccess({
                fileId: file.id,
                caseId: file.caseId,
                action: "DOWNLOAD",
                outcome: "DENIED",
                userId: session.user.id,
                metadata: { reason: "two_factor_required", ipAddress, userAgent },
            })
            return NextResponse.json({ error: "two_factor_required" }, { status: 401 })
        }
    }

    try {
        const { body, contentType } = await readLabFile(
            file.storagePath,
            file.storageProvider as "blob" | "local"
        )

        await recordFileAccess({
            fileId: file.id,
            caseId: file.caseId,
            action: "DOWNLOAD",
            outcome: "ALLOWED",
            userId: session.user.id,
            metadata: { fileName: file.fileName, ipAddress, userAgent },
        })

        return new NextResponse(new Uint8Array(body), {
            headers: {
                "Content-Type": contentType || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${sanitizeFileName(file.fileName)}"`,
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        console.error("[lab] Failed to read file:", error)
        await recordFileAccess({
            fileId: file.id,
            caseId: file.caseId,
            action: "DOWNLOAD",
            outcome: "DENIED",
            userId: session.user.id,
            metadata: { reason: "storage_error", ipAddress, userAgent },
        })
        return NextResponse.json({ error: "Could not read file" }, { status: 500 })
    }
}
