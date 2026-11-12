import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Public route that serves a profile avatar.
//
// The bytes are stored in the database (User.avatarData); `User.image` only
// keeps the URL of this route, so no base64 image ever ends up in a cookie.

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { avatarData: true, avatarType: true },
        })

        if (!user?.avatarData) {
            return new NextResponse(null, { status: 404 })
        }

        return new NextResponse(new Uint8Array(user.avatarData), {
            headers: {
                "content-type": user.avatarType || "image/jpeg",
                "content-length": String(user.avatarData.length),
                "cache-control": "public, max-age=31536000, immutable",
            },
        })
    } catch {
        return new NextResponse(null, { status: 404 })
    }
}
