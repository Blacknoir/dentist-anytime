// Stub of "next/server" for the tests: the real module can only be loaded
// inside a Next.js server.
export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
        return new Response(JSON.stringify(body), {
            ...init,
            headers: { "content-type": "application/json", ...(init?.headers || {}) },
        })
    }
}

export class NextRequest extends Request {}

export function userAgent(request: Request) {
    return { ua: request.headers.get("user-agent") || "" }
}
