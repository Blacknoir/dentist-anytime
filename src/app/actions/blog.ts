"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function getBlogPosts() {
    return await prisma.blogPost.findMany({
        where: { published: true },
        include: {
            dentistProfile: {
                include: {
                    user: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getBlogPostBySlug(slug: string) {
    return await prisma.blogPost.findUnique({
        where: { slug },
        include: {
            dentistProfile: {
                include: {
                    user: true
                }
            }
        }
    })
}

export async function getDentistBlogPosts() {
    const session = await auth()
    if (!session?.user?.id) return []

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) return []

    return await prisma.blogPost.findMany({
        where: { dentistProfileId: dentist.id },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createBlogPost(data: {
    title_en: string,
    title_el: string,
    content_en: string,
    content_el: string,
    image?: string,
    category: string,
    slug: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist profile not found")

    const post = await prisma.blogPost.create({
        data: {
            ...data,
            dentistProfileId: dentist.id
        }
    })

    revalidatePath("/blog")
    revalidatePath("/dashboard/blog")
    return post
}

export async function deleteBlogPost(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const dentist = await prisma.dentistProfile.findUnique({
        where: { userId: session.user.id }
    })

    if (!dentist) throw new Error("Dentist profile not found")

    await prisma.blogPost.delete({
        where: {
            id,
            dentistProfileId: dentist.id // Safety check
        }
    })

    revalidatePath("/blog")
    revalidatePath("/dashboard/blog")
}
