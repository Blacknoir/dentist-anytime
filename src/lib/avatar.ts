// Profile avatars.
//
// The avatar used to be stored as a base64 data URL inside `User.image`. That
// value ends up in the session token (the JWT strategy copies `user.image`
// into `token.picture`), so a 70KB avatar produced a 70KB session cookie and
// every request sent headers above the host limit -> 494 REQUEST_HEADER_TOO_LARGE.
//
// The avatar is now a file: the bytes live in `User.avatarData` and `image`
// keeps the public URL of the avatar route.

import { prisma } from "@/lib/prisma"

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/

export function isDataUrl(value: unknown): value is string {
    return typeof value === "string" && value.startsWith("data:image/")
}

export function avatarPublicUrl(userId: string) {
    return `/api/avatar/${userId}`
}

export function decodeAvatarDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
    const match = DATA_URL_PATTERN.exec(dataUrl)
    if (!match) return null

    const contentType = match[1].toLowerCase()
    if (!contentType.startsWith("image/")) return null

    const buffer = Buffer.from(match[2], "base64")
    if (!buffer.length || buffer.length > MAX_AVATAR_BYTES) return null

    return { buffer, contentType }
}

/**
 * Removes the picture from a session token when it is a base64 image (or any
 * value that is too long). The picture is copied into the JWT, and a 70KB
 * avatar would produce a session cookie that the host rejects with
 * 494 REQUEST_HEADER_TOO_LARGE.
 */
export function stripAvatarFromToken(token: { picture?: unknown }) {
    const picture = token.picture
    if (typeof picture !== "string") return
    if (picture.startsWith("data:") || picture.length > 1000) {
        token.picture = undefined
    }
}

/**
 * Stores an avatar that was sent as a data URL and returns its public URL.
 * Returns null when the value is not a usable image.
 */
export async function storeAvatarFromDataUrl(userId: string, dataUrl: string) {
    const decoded = decodeAvatarDataUrl(dataUrl)
    if (!decoded) return null

    await prisma.user.update({
        where: { id: userId },
        data: {
            avatarData: decoded.buffer,
            avatarType: decoded.contentType,
            image: avatarPublicUrl(userId),
        },
    })

    return avatarPublicUrl(userId)
}
