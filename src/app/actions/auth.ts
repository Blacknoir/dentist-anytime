"use server"

import { signIn as authSignIn, signOut as authSignOut } from "@/auth"
import { cookies } from "next/headers"

export async function signInWithGoogle(role: string = "PATIENT") {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    await authSignIn("google", { redirectTo: "/" })
}

export async function signInWithFacebook(role: string = "PATIENT") {
    const cookieStore = await cookies()
    cookieStore.set("pending_role", role)
    await authSignIn("facebook", { redirectTo: "/" })
}

export async function signOut() {
    await authSignOut()
}
