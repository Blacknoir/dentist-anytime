"use server"

import { signIn as authSignIn, signOut as authSignOut, auth } from "@/auth"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { normalizeMainRole } from "@/lib/roles"

/**
 * Sign in of the main site. The role of the form is only a hint for a brand
 * new account: an account that already exists keeps its role, the sign in
 * never changes it.
 */
export async function signInWithGoogle(role: string = "PATIENT") {
    const cookieStore = await cookies()
    const safeRole = normalizeMainRole(role)
    cookieStore.set("pending_role", safeRole)
    const redirectTo = safeRole === "DENTIST" ? "/dashboard/profile" : "/dashboard"
    await authSignIn("google", { redirectTo })
}

export async function signInWithFacebook(role: string = "PATIENT") {
    const cookieStore = await cookies()
    const safeRole = normalizeMainRole(role)
    cookieStore.set("pending_role", safeRole)
    const redirectTo = safeRole === "DENTIST" ? "/dashboard/profile" : "/dashboard"
    await authSignIn("facebook", { redirectTo })
}

export async function signOut() {
    await authSignOut()
}

export async function deleteAccount() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const userId = session.user.id

    // Deal with cascade deletes manually if missing
    try {
        const dentistProfile = await prisma.dentistProfile.findUnique({
            where: { userId }
        })

        if (dentistProfile) {
            await prisma.booking.deleteMany({
                where: { dentistProfileId: dentistProfile.id }
            })
        }

        await prisma.booking.deleteMany({
            where: { patientId: userId }
        })

        await prisma.user.delete({
            where: { id: userId }
        })
    } catch (e) {
        console.error("Failed to delete account", e)
        throw new Error("Failed to delete account")
    }

    // We can't call authSignOut() here because it might redirect, but we can clear cookies if we want, or handle redirect in client.
    // wait, we can just return success and let the client log out.
    return { success: true }
}
