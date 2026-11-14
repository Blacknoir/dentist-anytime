// Normalises the redirect target of the sign-in flow.
//
// The result is written to the callback url cookie and is used as a redirect.
// It must stay short and stay inside the site: a growing callback url was the
// reason for the "494 REQUEST_HEADER_TOO_LARGE" errors of the host.

export const MAX_REDIRECT_LENGTH = 300

export function sanitizeRedirectUrl(url: string, baseUrl: string) {
    let target = url

    try {
        const parsed = new URL(url, baseUrl)
        const base = new URL(baseUrl)
        if (parsed.origin !== base.origin) {
            return base.origin
        }
        target = parsed.pathname + parsed.search
    } catch {
        target = url.startsWith("/") ? url : baseUrl
    }

    try {
        const parsed = new URL(target, baseUrl)
        if (parsed.searchParams.has("callbackUrl")) {
            parsed.searchParams.delete("callbackUrl")
        }
        target = parsed.pathname + (parsed.search ? parsed.search : "")
    } catch {
        // keep the raw value
    }

    if (target.length > MAX_REDIRECT_LENGTH) {
        target = target.slice(0, MAX_REDIRECT_LENGTH)
    }

    return target
}
