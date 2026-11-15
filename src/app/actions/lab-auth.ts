"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { signIn as authSignIn } from "@/auth"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ensureRoleProfile, hasRoleProfile } from "@/lib/lab-role-profiles"
import { isLabRole, type LabRole } from "@/lib/roles"
import { LabActionError } from "@/lib/lab-domain"

export type { LabRole }

/**
 * Sign in for the Lab marketplace. The selected role is only a hint that is
 * used for a brand new account: the sign in callback never changes the role
 * of an account that already exists.
 */
export async function signInWithGoogleLab(role: LabRole) {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", isLabRole(role) ? role : "PATIENT")
    const redirectTo = role === "DESIGNER" ? "/lab/designer" : "/lab/cases"
    await authSignIn("google", { redirectTo })
}

export async function signInWithFacebookLab(role: LabRole) {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", isLabRole(role) ? role : "PATIENT")
    const redirectTo = role === "DESIGNER" ? "/lab/designer" : "/lab/cases"
    await authSignIn("facebook", { redirectTo })
}

/**
 * Development-only quick sign-in with an existing account (no OAuth redirect).
 * The credentials provider rejects this outside of development.
 */
export async function signInWithLabAccount(email: string, password: string) {
    await authSignIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirectTo: "/lab/cases"
    })
}

/**
 * Professional registration: the user is already signed in and asks to work
 * as a dentist, a lab or a CAD designer.
 *
 * The role is checked on the server (never ADMIN), the profile is created
 * only once and an account that is already a professional of the Lab keeps
 * its role.
 */
export async function joinLabRole(role: LabRole) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new LabActionError("UNAUTHENTICATED", "Πρέπει να είσαι συνδεδεμένος.", 401)
    }

    if (!isLabRole(role)) {
        throw new LabActionError("VALIDATION", "Μη έγκυρος ρόλος.")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
    })
    if (!user) {
        throw new LabActionError("NOT_FOUND", "Ο λογαριασμός δεν βρέθηκε.", 404)
    }

    if (user.role === "ADMIN") {
        throw new LabActionError(
            "FORBIDDEN",
            "Ο διαχειριστής της πλατφόρμας δεν χρειάζεται επαγγελματικό προφίλ.",
            403
        )
    }

    if (user.role === role && (await hasRoleProfile(user.id, role))) {
        // Already registered: nothing changes.
        revalidatePath("/lab")
        return { ok: true, role, alreadyRegistered: true }
    }

    if (user.role !== "PATIENT" && user.role !== role) {
        // A professional of the Lab does not change profession by accident.
        throw new LabActionError(
            "ROLE_LOCKED",
            "Ο λογαριασμός σου έχει ήδη επαγγελματικό προφίλ στο Lab. Επικοινώνησε με την ομάδα για αλλαγή.",
            409
        )
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { role },
    })
    await ensureRoleProfile(user.id, role)

    revalidatePath("/lab")
    revalidatePath("/lab/cases")
    revalidatePath("/lab/designer")

    return { ok: true, role, alreadyRegistered: false }
}
