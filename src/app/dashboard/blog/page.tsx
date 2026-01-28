import { getDentistBlogPosts } from "@/app/actions/blog"
import { BlogListClient } from "@/components/blog/blog-list-client"

export default async function DentistBlogPage() {
    const posts = await getDentistBlogPosts()

    return <BlogListClient initialPosts={posts} />
}
