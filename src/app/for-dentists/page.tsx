"use client"

import { useLanguage } from "@/lib/LanguageContext"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CheckCircle2, TrendingUp, Users, ShieldCheck, Zap, Globe, BarChart3, Clock } from "lucide-react"

export default function ForDentistsPage() {
    const { t } = useLanguage()

    const stats = [
        { label: t('dentists.stats.patients'), value: '500k+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: t('dentists.stats.growth'), value: '45%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: t('dentists.stats.satisfaction'), value: '98%', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

    const features = [
        {
            title: t('dentists.feature1.title'),
            desc: t('dentists.feature1.desc'),
            image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=2070&auto=format&fit=crop",
            icon: Globe,
            bullets: [t('dentists.feature1.bullet1'), t('dentists.feature1.bullet2'), t('dentists.feature1.bullet3')]
        },
        {
            title: t('dentists.feature2.title'),
            desc: t('dentists.feature2.desc'),
            image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2070&auto=format&fit=crop",
            icon: Zap,
            bullets: [t('dentists.feature2.bullet1'), t('dentists.feature2.bullet2'), t('dentists.feature2.bullet3')]
        },
        {
            title: t('dentists.feature3.title'),
            desc: t('dentists.feature3.desc'),
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
            icon: BarChart3,
            bullets: [t('dentists.feature3.bullet1'), t('dentists.feature3.bullet2'), t('dentists.feature3.bullet3')]
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden bg-slate-900 text-white">
                    <div className="absolute inset-0 opacity-20">
                        <Image
                            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
                            alt="Background"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-3xl mx-auto"
                        >
                            <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider uppercase bg-primary-500/20 text-primary-400 rounded-full border border-primary-500/30">
                                For Dental Professionals
                            </span>
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight">
                                {t('dentists.hero.title')}
                            </h1>
                            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
                                {t('dentists.hero.subtitle')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" className="h-14 px-10 text-lg bg-primary-500 hover:bg-primary-600 border-none" asChild>
                                    <Link href="/register?role=DENTIST">
                                        {t('dentists.hero.cta')}
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-white/20 text-white hover:bg-white/10">
                                    View Demo
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 -mt-12 relative z-20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-6"
                                >
                                    <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                                        <div className="text-slate-500 font-medium">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="space-y-32">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        className="flex-1 space-y-8"
                                    >
                                        <div className="p-3 w-fit rounded-2xl bg-primary-50 text-primary-600">
                                            <feature.icon className="h-8 w-8" />
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900">
                                            {feature.title}
                                        </h2>
                                        <p className="text-xl text-slate-600 leading-relaxed">
                                            {feature.desc}
                                        </p>
                                        <ul className="space-y-4">
                                            {feature.bullets.map((bullet, i) => (
                                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                                    <CheckCircle2 className="h-5 w-5 text-primary-500" />
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="flex-1 w-full"
                                    >
                                        <div className="relative aspect-video lg:aspect-square rounded-[2rem] overflow-hidden shadow-2xl">
                                            <Image
                                                src={feature.image}
                                                alt={feature.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent" />
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing / CTA Section */}
                <section className="py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
                            <div className="p-12 md:p-16 flex-1 bg-primary-600 text-white flex flex-col justify-center">
                                <h2 className="text-4xl font-bold mb-6">
                                    {t('dentists.cta.title')}
                                </h2>
                                <p className="text-primary-100 text-lg mb-10">
                                    {t('dentists.cta.desc')}
                                </p>
                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-6 w-6 text-primary-200" />
                                        <span>Setup in less than 5 minutes</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Zap className="h-6 w-6 text-primary-200" />
                                        <span>No upfront costs or hidden fees</span>
                                    </div>
                                </div>
                                <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50 h-14 text-lg" asChild>
                                    <Link href="/register?role=DENTIST">
                                        {t('dentists.cta.button')}
                                    </Link>
                                </Button>
                            </div>
                            <div className="flex-1 p-12 md:p-16 flex flex-col justify-center border-l border-slate-100">
                                <h3 className="text-2xl font-bold text-slate-900 mb-8">What you'll get:</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    {[
                                        'Professional Verified Profile',
                                        'Direct Booking Integration',
                                        'Automatic SMS/Email Reminders',
                                        'Patient Feedback Management',
                                        'Advanced SEO Optimization',
                                        '24/7 Dedicated Support'
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 text-slate-600">
                                            <div className="h-2 w-2 rounded-full bg-primary-500" />
                                            <span className="font-medium">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
