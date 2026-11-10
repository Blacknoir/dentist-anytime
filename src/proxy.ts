import { NextResponse } from "next/server"
import { createHash } from "crypto"
import type { NextAuthRequest } from "next-auth"
import { auth } from "@/auth"

/**
 * Every cookie the app may set for authentication. They are cleared when the
 * browser sends a broken/oversized authentication state, so the visitor can
 * recover without touching the browser settings.
 */
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

const CSRF_COOKIE_NAMES = [
    "authjs.csrf-token",
    "__Secure-authjs.csrf-token",
    "__Host-authjs.csrf-token",
]

/** Above this size the hosting platform rejects the request headers. */
const MAX_COOKIE_HEADER_SIZE = 6000
const MAX_CALLBACK_URL_LENGTH = 300

function cleanCallbackUrl(value: string) {
    let target = value

    try {
        target = decodeURIComponent(value)
    } catch {
        // keep the raw value
    }

    try {
        const parsed = new URL(target, "https://placeholder.invalid")
        // A nested callbackUrl is what makes the auth cookies grow endlessly.
        parsed.searchParams.delete("callbackUrl")
        target = parsed.pathname + (parsed.search ? parsed.search : "")
    } catch {
        return "/"
    }

    if (!target.startsWith("/")) return "/"
    if (target.length > MAX_CALLBACK_URL_LENGTH) {
        target = target.slice(0, MAX_CALLBACK_URL_LENGTH)
    }
    return target
}

/**
 * The CSRF cookie is `token|hash` where the hash is derived from the auth
 * secret. When the secret changes (or the cookie comes from another
 * environment) the login silently fails, so the stale cookie is dropped and a
 * fresh one is issued.
 */
function isStaleCsrfCookie(value: string | undefined, secret: string | undefined) {
    if (!value || !secret) return false
    const [token, hash] = value.split("|")
    if (!token || !hash) return true
    const expected = createHash("sha256").update(`${token}${secret}`).digest("hex")
    return hash !== expected
}

export default auth((request: NextAuthRequest) => {
    const { pathname, searchParams } = request.nextUrl
    const cookieHeader = request.headers.get("cookie") || ""
    const staleCookies: string[] = []

    // Broken authentication state: drop the auth cookies so the visitor can
    // sign in again instead of carrying oversized headers around.
    if (cookieHeader.length > MAX_COOKIE_HEADER_SIZE) {
        staleCookies.push(...AUTH_COOKIES)
    } else {
        const secret = process.env.AUTH_SECRET
        for (const name of CSRF_COOKIE_NAMES) {
            const value = request.cookies.get(name)?.value
            if (isStaleCsrfCookie(value, secret)) staleCookies.push(name)
        }
    }

    // Keep the callback target small so the auth cookies can never grow.
    const callbackUrl = searchParams.get("callbackUrl")
    if (callbackUrl) {
        const cleaned = cleanCallbackUrl(callbackUrl)
        if (cleaned !== callbackUrl) {
            const url = request.nextUrl.clone()
            url.searchParams.set("callbackUrl", cleaned)
            const redirect = NextResponse.redirect(url)
            for (const name of staleCookies) redirect.cookies.set(name, "", { path: "/", maxAge: 0 })
            return redirect
        }
    }

    const session = request.auth
    const role = (session?.user as { role?: string } | undefined)?.role

    // The admin area has its own login page (username / password).
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (!session || role !== "ADMIN") {
            const redirect = NextResponse.redirect(new URL("/admin/login", request.nextUrl))
            for (const name of staleCookies) redirect.cookies.set(name, "", { path: "/", maxAge: 0 })
            return redirect
        }
    }

    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/booking")) && !session) {
        const redirect = NextResponse.redirect(new URL("/login", request.nextUrl))
        for (const name of staleCookies) redirect.cookies.set(name, "", { path: "/", maxAge: 0 })
        return redirect
    }

    const response = NextResponse.next()
    for (const name of staleCookies) {
        response.cookies.set(name, "", { path: "/", maxAge: 0 })
    }
    return response
})

export const config = {
    matcher: [
        /*
         * Everything except:
         * - api/auth (the authentication endpoints must stay untouched)
         * - static files and images
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|logo.jpg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
    ],
}
