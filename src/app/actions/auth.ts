"use server"

import { signIn as authSignIn, signOut as authSignOut, auth } from "@/auth"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function signInWithGoogle(role: string = "PATIENT") {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    await authSignIn("google", { redirectTo: "/dashboard" })
}

export async function signInWithFacebook(role: string = "PATIENT") {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    await authSignIn("facebook", { redirectTo: "/dashboard" })
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
