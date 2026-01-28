"use client"

import React from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export function LatestBlogPosts({ posts }: { posts: any[] }) {
    const { t, language } = useLanguage()

    if (posts.length === 0) return null

    return (
        <section className="py-24 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('pages.blog.title')}</h2>
                        <p className="text-lg text-gray-600">Expert insights and advice from our professional dental network.</p>
                    </div>
                    <Button variant="outline" size="lg" asChild className="rounded-full">
                        <Link href="/blog">
                            View All Articles <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {posts.slice(0, 3).map((post, idx) => {
                        const title = language === 'en' ? post.title_en : post.title_el
                        const excerpt = (language === 'en' ? post.content_en : post.content_el).substring(0, 100) + "..."

                        return (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <Image
                                        src={post.image || "/blog-placeholder.png"}
                                        alt={title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-primary-600 uppercase tracking-wider shadow-sm">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <Calendar className="h-3.5 w-3.5 text-primary-500" />
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <User className="h-3.5 w-3.5 text-primary-500" />
                                            Dr. {post.dentistProfile.user.name}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                        {title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                                        {excerpt}
                                    </p>
                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="text-primary-600 text-sm font-bold flex items-center gap-2 mt-auto group/btn"
                                    >
                                        Read Article
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                    </Link>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
