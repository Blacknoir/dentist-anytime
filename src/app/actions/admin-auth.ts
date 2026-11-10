"use server"

import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"

export type AdminLoginState = { error?: string }

/**
 * Standard admin sign-in (username / password). The credentials come from the
 * environment (ADMIN_USERNAME / ADMIN_PASSWORD) so they can be changed later
 * without touching the code, e.g. when moving to Google Workspace SSO.
 *
 * After a successful login the admin lands in the Dentora Lab console.
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
        // redirect: false keeps the visitor on this page when the credentials
        // are wrong instead of bouncing them to the patient login.
        const result = await signIn("credentials", {
            username,
            password,
            redirectTo: "/lab/admin",
            redirect: false,
        })

        const target = typeof result === "string" ? result : "/lab/admin"
        if (target.includes("error=")) {
            return { error: "Λανθασμένα στοιχεία σύνδεσης." }
        }

        redirect(target)
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Λανθασμένα στοιχεία σύνδεσης." }
        }
        // Redirect errors (successful sign-in) must bubble up.
        throw error
    }

    return { error: undefined }
}
