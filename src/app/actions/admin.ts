"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getDentistsForReview() {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return await prisma.dentistProfile.findMany({
        where: {
            isPendingVerification: true
        } as any,
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        }
    })
}

export async function getAllDentists() {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return await prisma.dentistProfile.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true
                }
            }
        }
    })
}

export async function verifyDentist(dentistId: string, status: boolean) {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await (prisma.dentistProfile as any).update({
        where: { id: dentistId },
        data: {
            isVerified: status,
            isPendingVerification: false
        }
    })

    revalidatePath("/admin/dashboard")
}

export async function submitDegreeForVerification(degreeImageUrl: string) {
    const session = await auth()
    if (!session?.user?.id || (session.user as any).role !== "DENTIST") {
        throw new Error("Unauthorized")
    }

    await (prisma.dentistProfile as any).update({
        where: { userId: session.user.id },
        data: {
            degreeImage: degreeImageUrl,
            isPendingVerification: true
        }
    })

    // In a real app, you would use a service like Resend or SendGrid here
    console.log(`[EMAIL MOCK] To: Admin, Subject: New Dentist Degree for Review, Content: Dentist ${session.user.email || "Unknown"} uploaded a degree: ${degreeImageUrl}`)

    revalidatePath("/dashboard")
}
