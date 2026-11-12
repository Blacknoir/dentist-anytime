import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { assignPublicCode } from "@/lib/lab-public-code"

import { cookies } from "next/headers"

// Credentials of the platform admin. Easy to change (and later to replace with
// Google Workspace / Gmail SSO) through the environment.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "12345"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dentistanytime.com"

const MAX_REDIRECT_LENGTH = 300

/**
 * Normalises a redirect target: same origin only, no nested `callbackUrl`
 * parameters and a hard length limit. This keeps the auth cookies small and
 * prevents the "494 REQUEST_HEADER_TOO_LARGE" errors.
 */
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

// Creates the profile that matches the selected role (dentist / lab / CAD designer).
async function ensureRoleProfile(userId: string, role: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, publicCode: true } })
    if (!user?.publicCode) {
        await assignPublicCode(userId, role)
    }

    if (role === "DENTIST") {
        const profile = await prisma.dentistProfile.findUnique({ where: { userId } })
        if (!profile) {
            await prisma.dentistProfile.create({
                data: {
                    userId,
                    specialty: "General Dentist",
                    location: "To be updated",
                    experienceYears: 0,
                    priceFrom: 0,
                    about: "New dentist profile",
                }
            })
        }
        return
    }

    if (role === "LAB") {
        const profile = await prisma.labProfile.findUnique({ where: { userId } })
        if (!profile) {
            await prisma.labProfile.create({
                data: {
                    userId,
                    labName: "Νέο οδοντοτεχνικό εργαστήριο",
                }
            })
        }
        return
    }

    if (role === "DESIGNER") {
        const profile = await prisma.designerProfile.findUnique({ where: { userId } })
        if (!profile) {
            await prisma.designerProfile.create({
                data: { userId, headline: "CAD Designer" }
            })
        }
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Facebook({
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: "Admin Login",
            credentials: {
                username: { label: "Username", type: "text" },
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (credentials?.username === ADMIN_USERNAME && credentials?.password === ADMIN_PASSWORD) {
                    let admin = await prisma.user.findUnique({
                        where: { email: ADMIN_EMAIL }
                    })
                    if (!admin) {
                        admin = await prisma.user.create({
                            data: {
                                email: ADMIN_EMAIL,
                                name: "Platform Admin",
                                role: "ADMIN"
                            }
                        })
                    }
                    if (!admin.publicCode) {
                        await assignPublicCode(admin.id, "ADMIN")
                    }
                    return admin
                }

                // Development-only quick login so the lab can be tested without
                // configuring an OAuth redirect. Disabled in production builds.
                if (process.env.NODE_ENV !== "production" && credentials?.email) {
                    const devPassword = process.env.LAB_DEV_PASSWORD || "dentora-dev"
                    const email = String(credentials.email).trim().toLowerCase()
                    if (credentials?.password === devPassword) {
                        const user = await prisma.user.findUnique({ where: { email } })
                        if (user) return user
                    }
                }

                return null
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    // The auth URLs follow the domain the visitor uses (dentora.gr / www /
    // localhost). On Vercel this is the default behaviour, the flag only
    // makes local production builds work as well.
    trustHost: true,
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        // The temporary cookies of the sign-in flow are only needed by the
        // auth endpoints. Scoping them keeps them away from the rest of the
        // site, so a single oversized cookie can never block the whole site.
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/api/auth",
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/api/auth",
                secure: process.env.NODE_ENV === "production",
            },
        },
        state: {
            name: `next-auth.state`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/api/auth",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 15,
            },
        },
        pkceCodeVerifier: {
            name: `next-auth.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/api/auth",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 15,
            },
        },
    },
    callbacks: {
        /**
         * Keeps the redirect target small and same-origin. Without this the
         * callback cookie can grow on every redirect until the browser sends
         * oversized headers (the host then answers with 494).
         */
        async redirect({ url, baseUrl }) {
            return sanitizeRedirectUrl(url, baseUrl)
        },
        async jwt({ token, user }) {
            if (user) {
                // Fetch the latest user data from DB to ensure role is correct (especially after first registration)
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { id: true, role: true }
                })
                
                if (dbUser) {
                    token.role = dbUser.role
                    token.id = dbUser.id
                } else {
                    token.role = (user as any).role
                    token.id = user.id
                }
            }
            // Keep the rest of the token (name, email, picture) so the session
            // exposes them; only role/id are refreshed from the database.
            return {
                ...token,
                id: token.id,
                role: token.role
            } as any
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role as string
                session.user.id = token.id as string
            }
            return session
        },
        async signIn({ user, account, profile }) {
            const cookieStore = await cookies()
            const pendingRole = cookieStore.get("pending_role")?.value

            if (pendingRole && user.id) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: user.id }
                })

                // Only update if role is different
                if (currentUser && currentUser.role !== pendingRole) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { role: pendingRole }
                    })
                }

                // Create the profile for the selected role (dentist / lab / designer)
                if (["DENTIST", "LAB", "DESIGNER"].includes(pendingRole)) {
                    await ensureRoleProfile(user.id, pendingRole)
                }

                // Clear the cookie
                cookieStore.delete("pending_role")
            }
            return true
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnBooking = nextUrl.pathname.startsWith("/booking")
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            const isOnAdmin = nextUrl.pathname.startsWith("/admin")

            if (isOnAdmin) {
                if (isLoggedIn && (auth.user as any).role === "ADMIN") return true
                if (nextUrl.pathname === "/admin/login") return true
                return false
            }

            if (isOnBooking || isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect to login
            }
            return true
        },
    },
    events: {
        async createUser({ user }) {
            const cookieStore = await cookies()
            const pendingRole = cookieStore.get("pending_role")?.value

            if (pendingRole && user.id) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { role: pendingRole }
                })

                if (["DENTIST", "LAB", "DESIGNER"].includes(pendingRole)) {
                    await ensureRoleProfile(user.id, pendingRole)
                }
                return
            }

            // Every account gets an anonymous marketplace code.
            const created = await prisma.user.findUnique({
                where: { id: user.id },
                select: { publicCode: true, role: true },
            })
            if (created && !created.publicCode && user.id) {
                await assignPublicCode(user.id, created.role || "PATIENT")
            }        }
    }
})
