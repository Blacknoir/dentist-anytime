"use server"

import { cookies } from "next/headers"
import { signIn as authSignIn } from "@/auth"

export type LabRole = "DENTIST" | "LAB" | "DESIGNER"

/**
 * Sign in for the Lab marketplace. The selected role is stored in the
 * pending_role cookie and applied by the NextAuth signIn callback, which also
 * creates the matching profile (dentist / lab / CAD designer).
 */
export async function signInWithGoogleLab(role: LabRole) {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    const redirectTo = role === "DESIGNER" ? "/lab/designer" : "/lab/cases"
    await authSignIn("google", { redirectTo })
}

export async function signInWithFacebookLab(role: LabRole) {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    const redirectTo = role === "DESIGNER" ? "/lab/designer" : "/lab/cases"
    await authSignIn("facebook", { redirectTo })
}
