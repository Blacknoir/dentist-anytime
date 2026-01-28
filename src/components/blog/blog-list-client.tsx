"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Eye, Edit3, MessageSquare, Newspaper } from 'lucide-react'
import Link from 'next/link'
import { deleteBlogPost } from '@/app/actions/blog'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function BlogListClient({ initialPosts }: { initialPosts: any[] }) {
    const router = useRouter()
    const [posts, setPosts] = React.useState(initialPosts)

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this article?")) return
        try {
            await deleteBlogPost(id)
            setPosts(posts.filter(p => p.id !== id))
        } catch (err) {
            alert("Delete failed")
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Articles</h1>
                    <p className="text-gray-500">Manage your clinical insights and patient advice.</p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/dashboard/blog/new">
                        <Plus className="h-4 w-4" /> Write New Article
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.length > 0 ? posts.map(post => (
                    <Card key={post.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
                        <div className="relative h-48">
                            <Image
                                src={post.image || "/blog-placeholder.png"}
                                alt=""
                                fill
                                className="object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary-600 shadow-sm">
                                {post.category}
                            </div>
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary-600 transition-colors">
                                {post.title_en}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-gray-500 line-clamp-2 uppercase tracking-wide font-medium">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </p>

                            <div className="flex items-center gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                                    <Link href={`/blog/${post.slug}`} target="_blank">
                                        <Eye className="h-3.5 w-3.5" /> View
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1 gap-2">
                                    <Edit3 className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(post.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                        <Newspaper className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No articles yet</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                            Share your expertise with patients and build trust by writing your first article.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/blog/new">Start Writing</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
