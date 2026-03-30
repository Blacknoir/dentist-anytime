"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, ArrowLeft, Image as ImageIcon, Globe, FileText } from 'lucide-react'
import Link from 'next/link'
import { createBlogPost } from '@/app/actions/blog'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'

export default function NewArticlePage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        title_en: "",
        title_el: "",
        content_en: "",
        content_el: "",
        category: "Advice",
        image: "",
        slug: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Generate slug if empty
            const slug = formData.slug || formData.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            await createBlogPost({ ...formData, slug })
            router.push("/dashboard/blog")
        } catch (err) {
            alert(t('blog.create_failed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link
                        href="/dashboard/blog"
                        className="text-sm font-bold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" /> {t('blog.back')}
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{t('blog.write_title')}</h1>
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? t('blog.publishing') : <><Save className="h-4 w-4" /> {t('blog.publish')}</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Bilingual Titles */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary-600" /> {t('blog.titles')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="title_en" className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">EN</span>
                                    {t('blog.en_title')}
                                </Label>
                                <Input
                                    id="title_en"
                                    placeholder={t('blog.en_title_ph')}
                                    value={formData.title_en}
                                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title_el" className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">EL</span>
                                    {t('blog.el_title')}
                                </Label>
                                <Input
                                    id="title_el"
                                    placeholder={t('blog.el_title_ph')}
                                    value={formData.title_el}
                                    onChange={(e) => setFormData({ ...formData, title_el: e.target.value })}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bilingual Content */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary-600" /> {t('blog.content_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="content_en" className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">EN</span>
                                    {t('blog.en_content')}
                                </Label>
                                <Textarea
                                    id="content_en"
                                    rows={10}
                                    placeholder={t('blog.en_content_ph')}
                                    value={formData.content_en}
                                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content_el" className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-bold">EL</span>
                                    {t('blog.el_content')}
                                </Label>
                                <Textarea
                                    id="content_el"
                                    rows={10}
                                    placeholder={t('blog.el_content_ph')}
                                    value={formData.content_el}
                                    onChange={(e) => setFormData({ ...formData, content_el: e.target.value })}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Settings */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('blog.settings')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">{t('blog.category')}</Label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full h-10 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                >
                                    <option value="Advice">{t('blog.cat_tips')}</option>
                                    <option value="Case Study">{t('blog.cat_case')}</option>
                                    <option value="Technology">{t('blog.cat_tech')}</option>
                                    <option value="News">{t('blog.cat_news')}</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">{t('blog.slug')}</Label>
                                <Input
                                    id="slug"
                                    placeholder={t('blog.slug_ph')}
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 italic">{t('blog.slug_hint')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cover Image */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="bg-gray-50/50">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('blog.cover_image')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="image">{t('blog.image_url')}</Label>
                                <div className="space-y-3">
                                    <div className="relative aspect-video bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-gray-200" />
                                        )}
                                    </div>
                                    <Input
                                        id="image"
                                        placeholder={t('blog.image_ph')}
                                        value={formData.image}
                                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    )
}
