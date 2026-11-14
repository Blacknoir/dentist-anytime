import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readPortfolioImage } from "@/lib/lab-portfolio"

// Public route of a portfolio image. The portfolio shows the work of the
// designers and the labs, so the pictures are public (the case files stay
// private).

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const item = await prisma.portfolioItem.findUnique({
            where: { id },
            select: {
                id: true,
                storagePath: true,
                storageProvider: true,
                content: true,
                mimeType: true,
            },
        })

        if (!item) {
            return new NextResponse(null, { status: 404 })
        }

        const body = await readPortfolioImage(item)

        return new NextResponse(new Uint8Array(body), {
            headers: {
                "Content-Type": item.mimeType || "image/jpeg",
                "Content-Length": String(body.length),
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
                "X-Content-Type-Options": "nosniff",
            },
        })
    } catch (error) {
        console.error("[lab-portfolio] Failed to read image:", error)
        return new NextResponse(null, { status: 500 })
    }
}
