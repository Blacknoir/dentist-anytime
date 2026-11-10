"use server"

import { AuthError } from "next-auth"
import { signIn } from "@/auth"

export type AdminLoginState = { error?: string }

/**
 * Standard admin sign-in (username / password). The credentials come from the
 * environment (ADMIN_USERNAME / ADMIN_PASSWORD) so they can be changed later
 * without touching the code, e.g. when moving to Google Workspace SSO.
 */
export async function signInAdmin(
    _previous: AdminLoginState | null,
    formData: FormData
): Promise<AdminLoginState> {
    const username = String(formData.get("username") || "").trim()
    const password = String(formData.get("password") || "")

    if (!username || !password) {
        return { error: "Συμπλήρωσε username και κωδικό." }
    }

    try {
        await signIn("credentials", {
            username,
            password,
            redirectTo: "/admin/dashboard",
        })
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Λανθασμένα στοιχεία σύνδεσης." }
        }
        // Redirect errors (successful sign-in) must bubble up.
        throw error
    }

    return { error: undefined }
}
