"use client"

import React from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Link2, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

export function PostClient({ post, related }: { post: any, related: any[] }) {
    const { t, language } = useLanguage()

    const title = language === 'en' ? post.title_en : post.title_el
    const content = language === 'en' ? post.content_en : post.content_el
    const date = format(new Date(post.createdAt), 'MMMM dd, yyyy')
    const author = post.dentistProfile.user.name
    const category = post.category

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Post Header / Hero */}
            <div className="pt-32 pb-16 bg-gray-50 border-b border-gray-100">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 mb-8 group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        {language === 'en' ? "Back to News" : "Επιστροφή στα Νέα"}
                    </Link>

                    <div className="space-y-6">
                        <span className="bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-primary-200">
                            {t(`blog.category.${category.toLowerCase().replace(' ', '_')}`)}
                        </span>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                            {title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 pt-4 text-gray-500">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                    {post.dentistProfile.user.image ? (
                                        <img src={post.dentistProfile.user.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 font-bold">
                                            {author.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Dr. {author}</p>
                                    <p className="text-xs uppercase tracking-wider font-medium text-primary-600 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Verified Specialist
                                    </p>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-gray-200 hidden sm:block" />
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4 text-primary-500" />
                                {date}
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4 text-primary-500" />
                                5 min read
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <main className="container mx-auto px-4 py-16">
                <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto">
                    {/* Main Content */}
                    <div className="lg:w-2/3">
                        {post.image && (
                            <div className="relative aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl border border-gray-100">
                                <Image
                                    src={post.image}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <div className="prose prose-lg prose-primary max-w-none">
                            {content.split('\n').map((para: string, i: number) => (
                                <p key={i} className="text-gray-700 leading-relaxed text-lg mb-6">
                                    {para}
                                </p>
                            ))}
                        </div>

                        {/* Tags / Share */}
                        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t('blog.share')}</span>
                                <div className="flex gap-2">
                                    <button className="p-2 rounded-full border border-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        <Facebook className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 rounded-full border border-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        <Twitter className="h-5 w-5" />
                                    </button>
                                    <button className="p-2 rounded-full border border-gray-100 hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                        <Link2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Related */}
                    <aside className="lg:w-1/3">
                        <div className="sticky top-32 space-y-12">
                            {/* Author Box */}
                            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary-600" />
                                    About the Author
                                </h3>
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                        {post.dentistProfile.user.image ? (
                                            <img src={post.dentistProfile.user.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-bold text-xl">
                                                {author.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Dr. {author}</h4>
                                        <p className="text-sm text-primary-600 font-medium">{post.dentistProfile.specialty}</p>
                                    </div>
                                    <p className="text-sm text-gray-500 italic">
                                        {post.dentistProfile.about?.substring(0, 100)}...
                                    </p>
                                    <Button variant="outline" size="sm" asChild className="w-full">
                                        <Link href={`/dentist/${post.dentistProfile.id}`}>
                                            View Professional Profile
                                        </Link>
                                    </Button>
                                    <Button size="sm" asChild className="w-full">
                                        <Link href="/search">
                                            Book an Appointment
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Related Posts */}
                            {related.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary-600" />
                                        {t('blog.related')}
                                    </h3>
                                    <div className="space-y-6">
                                        {related.map(r => (
                                            <Link
                                                key={r.id}
                                                href={`/blog/${r.slug}`}
                                                className="flex gap-4 group"
                                            >
                                                <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                                    <Image
                                                        src={r.image || "/blog-placeholder.png"}
                                                        alt=""
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-110"
                                                    />
                                                </div>
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                                                        {language === 'en' ? r.title_en : r.title_el}
                                                    </h4>
                                                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">
                                                        {t(`blog.category.${r.category.toLowerCase().replace(' ', '_')}`)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    )
}
