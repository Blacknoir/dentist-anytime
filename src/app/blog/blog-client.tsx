"use client"

import React from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Calendar, User, ArrowRight, Tag, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

interface BlogPost {
    id: string
    title: string
    excerpt: string
    category: string
    author: string
    authorImage?: string | null
    date: string
    imageSpec: string
    slug: string
}

export default function BlogClient({ posts }: { posts: any[] }) {
    const { t, language } = useLanguage()
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState("All")

    const categories = ["All", "Advice", "Case Study", "Technology", "News"]

    const mappedPosts = posts.map(p => ({
        id: p.id,
        title: language === 'en' ? p.title_en : p.title_el,
        excerpt: (language === 'en' ? p.content_en : p.content_el).substring(0, 150) + "...",
        category: p.category,
        author: p.dentistProfile.user.name,
        authorImage: p.dentistProfile.user.image,
        date: format(new Date(p.createdAt), 'MMM dd, yyyy'),
        imageSpec: p.image || "/blog-placeholder.png",
        slug: p.slug
    }))

    const filteredPosts = mappedPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const featuredPost = filteredPosts[0]
    const remainingPosts = filteredPosts.slice(1)

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 pt-32 pb-20">
                {/* Hero / Header */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6"
                    >
                        {t('pages.blog.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600 leading-relaxed"
                    >
                        {t('pages.blog.desc')}
                    </motion.p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    selectedCategory === cat
                                        ? "bg-primary-600 text-white shadow-md shadow-primary-200"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {cat === "All" ? (language === 'en' ? "All Articles" : "Όλα τα Άρθρα") : t(`blog.category.${cat.toLowerCase().replace(' ', '_')}`)}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={language === 'en' ? "Search articles..." : "Αναζήτηση..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {filteredPosts.length > 0 ? (
                    <div className="space-y-16">
                        {/* Featured Post */}
                        {selectedCategory === "All" && searchQuery === "" && featuredPost && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 flex flex-col lg:flex-row"
                            >
                                <div className="lg:w-3/5 relative h-[300px] lg:h-auto overflow-hidden">
                                    <Image
                                        src={featuredPost.imageSpec}
                                        alt={featuredPost.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-primary-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                                            Featured
                                        </span>
                                    </div>
                                </div>
                                <div className="lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 text-sm text-primary-600 font-bold mb-4">
                                        <Tag className="h-4 w-4" />
                                        {t(`blog.category.${featuredPost.category.toLowerCase().replace(' ', '_')}`)}
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-gray-600 mb-8 leading-relaxed">
                                        {featuredPost.excerpt}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                                                {featuredPost.authorImage ? (
                                                    <img src={featuredPost.authorImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold text-xs bg-primary-50">
                                                        {featuredPost.author.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-bold text-gray-900">Dr. {featuredPost.author}</p>
                                                <p className="text-gray-500">{featuredPost.date}</p>
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={`/blog/${featuredPost.slug}`}>
                                                {t('blog.read_more')} <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Posts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(selectedCategory !== "All" || searchQuery !== "" ? filteredPosts : remainingPosts).map((post, idx) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
                                >
                                    <div className="relative h-64 overflow-hidden">
                                        <Image
                                            src={post.imageSpec}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                                                {t(`blog.category.${post.category.toLowerCase().replace(' ', '_')}`)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex flex-col flex-1">
                                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-primary-500" />
                                                {post.date}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-gray-200" />
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <User className="h-3.5 w-3.5 text-primary-500" />
                                                Dr. {post.author}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                                            {post.excerpt}
                                        </p>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-primary-600 text-sm font-bold flex items-center gap-2 mt-auto group/btn"
                                        >
                                            {t('blog.read_more')}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('blog.no_posts')}</h3>
                        <p className="text-gray-500">Try adjusting your filters or search query.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }} className="mt-4">
                            Clear all filters
                        </Button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
