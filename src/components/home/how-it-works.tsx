"use client"

import { motion } from "framer-motion"
import { Search, CalendarCheck, Star } from "lucide-react"
import { useLanguage } from "@/lib/LanguageContext"

export function HowItWorks() {
    const { t } = useLanguage()

    const steps = [
        {
            icon: Search,
            title: t('how_it_works.step1_title'),
            description: t('how_it_works.step1_desc'),
            color: "bg-blue-100 text-blue-600",
        },
        {
            icon: CalendarCheck,
            title: t('how_it_works.step2_title'),
            description: t('how_it_works.step2_desc'),
            color: "bg-green-100 text-green-600",
        },
        {
            icon: Star,
            title: t('how_it_works.step3_title'),
            description: t('how_it_works.step3_desc'),
            color: "bg-yellow-100 text-yellow-600",
        },
    ]

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        {t('how_it_works.title')}
                    </h2>
                    <p className="text-lg text-gray-600">
                        {t('how_it_works.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gray-100 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="flex flex-col items-center text-center group"
                        >
                            <div className={`w-24 h-24 rounded-2xl ${step.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <step.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                                {step.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
