import { NextResponse } from "next/server"

const AUTH_COOKIES = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "__Host-authjs.session-token",
    "next-auth.callback-url",
    "__Secure-authjs.callback-url",
    "authjs.callback-url",
    "next-auth.csrf-token",
    "__Secure-authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "next-auth.state",
    "__Secure-authjs.state",
    "authjs.state",
    "next-auth.pkce.code_verifier",
    "__Secure-authjs.pkce.code_verifier",
    "authjs.pkce.code_verifier",
    "pending_role",
    "lab_2fa_grant",
]

/**
 * Clears every authentication cookie of the site. Useful when the browser
 * keeps a broken session state (for example after a failed OAuth round trip).
 */
export async function GET(request: Request) {
    const url = new URL(request.url)
    const redirectTo = url.searchParams.get("redirectTo") || "/login"

    const response = NextResponse.redirect(new URL(redirectTo, url.origin))
    for (const name of AUTH_COOKIES) {
        // The secure flag is required so that __Host-/__Secure- cookies are
        // really removed by the browser.
        response.cookies.set(name, "", {
            path: "/",
            maxAge: 0,
            secure: true,
            httpOnly: true,
            sameSite: "lax",
        })
    }
    return response
}
