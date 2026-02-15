import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

import { cookies } from "next/headers"

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
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (credentials?.username === "admin" && credentials?.password === "452996") {
                    let admin = await prisma.user.findUnique({
                        where: { email: "admin@dentistanytime.com" }
                    })
                    if (!admin) {
                        admin = await prisma.user.create({
                            data: {
                                email: "admin@dentistanytime.com",
                                name: "Platform Admin",
                                role: "ADMIN"
                            }
                        })
                    }
                    return admin
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
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = (user as any).role
                token.id = user.id
            }
            // Optimization: Keep the token extremely small
            return {
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

                    // Create dentist profile if it doesn't exist
                    if (pendingRole === "DENTIST") {
                        const profile = await prisma.dentistProfile.findUnique({
                            where: { userId: user.id }
                        })
                        if (!profile) {
                            await prisma.dentistProfile.create({
                                data: {
                                    userId: user.id,
                                    specialty: "General Dentist",
                                    location: "To be updated",
                                    experienceYears: 0,
                                    priceFrom: 0,
                                    about: "New dentist profile",
                                }
                            })
                        }
                    }
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

                if (pendingRole === "DENTIST") {
                    await prisma.dentistProfile.create({
                        data: {
                            userId: user.id,
                            specialty: "General Dentist",
                            location: "To be updated",
                            experienceYears: 0,
                            priceFrom: 0,
                            about: "New dentist profile",
                        }
                    })
                }
            }
        }
    }
})
