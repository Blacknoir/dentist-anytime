// Server-side helper that assigns the anonymous marketplace code of a user.

import { prisma } from "@/lib/prisma"
import { derivePublicCode, PARTY_CODE_PREFIX } from "@/lib/lab"

/**
 * Assigns (and persists) a public code for the given user. The code is the
 * only identity counterpart parties can see inside the marketplace.
 */
export async function assignPublicCode(userId: string, role: string) {
    const prefix = PARTY_CODE_PREFIX[role] ?? "US"

    for (let attempt = 0; attempt < 12; attempt += 1) {
        const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
        const existing = await prisma.user.findUnique({
            where: { publicCode: code },
            select: { id: true },
        })
        if (existing) continue

        await prisma.user.update({ where: { id: userId }, data: { publicCode: code } })
        return code
    }

    // Extremely unlikely fallback: derive a stable code from the user id.
    const derived = derivePublicCode(userId, role)
    await prisma.user.update({ where: { id: userId }, data: { publicCode: derived } })
    return derived
}
