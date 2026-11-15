// Server-only helpers of the professional profiles of the Lab.
//
// The profile of a dentist, a lab or a CAD designer is created here, always
// in the same way and always idempotent: calling it twice never creates a
// second profile and never overwrites an existing one.

import "server-only"

import { prisma } from "@/lib/prisma"
import { assignPublicCode } from "@/lib/lab-public-code"
import { normalizeLabRole, profileRoleFor, type LabRole } from "@/lib/roles"

/**
 * Creates the profile that matches the role (dentist / lab / CAD designer) if
 * it does not exist yet. The role itself is never changed here: that is the
 * job of an explicit "professional registration".
 */
export async function ensureRoleProfile(userId: string, role: string) {
    const profileRole = profileRoleFor(role)
    if (!profileRole) return null

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, publicCode: true },
    })
    if (!user) return null

    if (!user.publicCode) {
        await assignPublicCode(userId, profileRole)
    }

    if (profileRole === "DENTIST") {
        const existing = await prisma.dentistProfile.findUnique({
            where: { userId },
            select: { id: true },
        })
        if (existing) return existing

        const profile = await prisma.dentistProfile.create({
            data: {
                userId,
                specialty: "General Dentist",
                location: "To be updated",
                experienceYears: 0,
                priceFrom: 0,
                about: "New dentist profile",
            },
        })
        return profile
    }

    if (profileRole === "LAB") {
        const existing = await prisma.labProfile.findUnique({
            where: { userId },
            select: { id: true },
        })
        if (existing) return existing

        const profile = await prisma.labProfile.create({
            data: {
                userId,
                labName: "Νέο οδοντοτεχνικό εργαστήριο",
            },
        })
        return profile
    }

    const existing = await prisma.designerProfile.findUnique({
        where: { userId },
        select: { id: true },
    })
    if (existing) return existing

    const profile = await prisma.designerProfile.create({
        data: { userId, headline: "CAD Designer" },
    })
    return profile
}

/**
 * The role of an account that already exists: it KEEPS its role. A plain
 * sign in never changes it. Only the profile of the role is created (and only
 * once).
 */
export async function keepRoleOnSignIn(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    if (!user) return null

    await ensureRoleProfile(userId, user.role)
    return user.role
}

/**
 * The role of an account that was just created: the role of the sign in form
 * is applied, after it was checked against the allowlist of the professional
 * roles (ADMIN is never part of it, not even if the browser sends it).
 */
export async function applyRoleOnAccountCreation(userId: string, pendingRole: unknown) {
    const hint = normalizeLabRole(pendingRole)

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    })
    if (!user) return null

    const role = hint !== "PATIENT" ? hint : user.role

    if (user.role !== role) {
        await prisma.user.update({ where: { id: userId }, data: { role } })
    }

    await ensureRoleProfile(userId, role)
    return role
}

/** True when the user already has the profile of the role. */
export async function hasRoleProfile(userId: string, role: LabRole) {
    if (role === "DENTIST") {
        const profile = await prisma.dentistProfile.findUnique({
            where: { userId },
            select: { id: true },
        })
        return !!profile
    }
    if (role === "LAB") {
        const profile = await prisma.labProfile.findUnique({
            where: { userId },
            select: { id: true },
        })
        return !!profile
    }
    const profile = await prisma.designerProfile.findUnique({
        where: { userId },
        select: { id: true },
    })
    return !!profile
}
