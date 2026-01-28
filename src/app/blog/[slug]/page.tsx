import { getBlogPostBySlug, getBlogPosts } from "@/app/actions/blog"
import { notFound } from "next/navigation"
import { PostClient } from "@/components/blog/post-client"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = await getBlogPostBySlug(slug)
    const allPosts = await getBlogPosts()

    // Filter out current post for "Related" section
    const relatedPosts = allPosts.filter((p: any) => p.slug !== slug).slice(0, 3)

    if (!post) {
        notFound()
    }

    return <PostClient post={post} related={relatedPosts} />
}
