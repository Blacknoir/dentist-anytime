"use client"

import { useLanguage } from "@/lib/LanguageContext"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function ServicesPage() {
    const { t } = useLanguage()

    const services = [
        {
            id: "whitening",
            title: t('services.whitening.title'),
            text: t('services.whitening.text'),
            details: t('services.whitening.details'),
            image: "/teeth_whitening_service_1768699680919.png",
        },
        {
            id: "root-canal",
            title: t('services.root_canal.title'),
            text: t('services.root_canal.text'),
            details: t('services.root_canal.details'),
            image: "/root_canal_service_1768699694248.png",
        },
        {
            id: "implants",
            title: t('services.implants.title'),
            text: t('services.implants.text'),
            details: t('services.implants.details'),
            image: "/dental_implants_service_1768699710063.png",
        },
        {
            id: "veneers",
            title: t('services.veneers.title'),
            text: t('services.veneers.text'),
            details: t('services.veneers.details'),
            image: "/veneers_service_1768699726113.png",
        },
        {
            id: "emergency",
            title: t('services.emergency.title'),
            text: t('services.emergency.text'),
            details: t('services.emergency.details'),
            image: "/emergency_dental_care_1768699743230.png",
        },
        {
            id: "cleaning",
            title: t('services.cleaning.title'),
            text: t('services.cleaning.text'),
            details: t('services.cleaning.details'),
            image: "/dental_checkup_cleaning_1768699761665.png",
        }
    ]

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <div className="pt-24 pb-20">
                {/* Hero Section */}
                <div className="bg-primary-50 py-16 mb-20">
                    <div className="container mx-auto px-4 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
                        >
                            {t('pages.services.title')}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-gray-600 max-w-2xl mx-auto"
                        >
                            {t('pages.services.desc')}
                        </motion.p>
                    </div>
                </div>

                <div className="container mx-auto px-4">
                    <div className="space-y-32">
                        {services.map((service, index) => (
                            <div
                                key={service.id}
                                id={service.id}
                                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
                            >
                                {/* Content */}
                                <motion.div
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="flex-1 space-y-6"
                                >
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Premium Service
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {service.title}
                                    </h2>
                                    <p className="text-lg text-gray-600 leading-relaxed">
                                        {service.text}
                                    </p>
                                    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                        <p className="text-gray-700 italic">
                                            "{service.details}"
                                        </p>
                                    </div>
                                    <Button size="lg" className="gap-2" asChild>
                                        <Link href="/search">
                                            {t('nav.book_appointment')}
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </motion.div>

                                {/* Image */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6 }}
                                    className="flex-1 w-full"
                                >
                                    <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl group">
                                        <Image
                                            src={service.image}
                                            alt={service.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="container mx-auto px-4 mt-32">
                    <div className="bg-primary-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative">
                            Ready to Transform Your Smile?
                        </h2>
                        <p className="text-primary-100 mb-10 text-lg max-w-xl mx-auto relative text-balance">
                            Join thousands of happy patients who trust our network of verified dental specialists.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                            <Button size="lg" className="bg-white text-primary-900 hover:bg-primary-50 text-lg px-10 py-7 h-auto" asChild>
                                <Link href="/search">Find a Dentist Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
