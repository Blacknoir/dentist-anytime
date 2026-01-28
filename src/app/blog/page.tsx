import { getBlogPosts } from "@/app/actions/blog"
import BlogClient from "./blog-client"

export default async function BlogPage() {
    const posts = await getBlogPosts()

    return <BlogClient posts={posts} />
}
