"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Star, Users } from "lucide-react"
import { SearchBar } from "@/components/home/search-bar"
import { useLanguage } from "@/lib/LanguageContext"

export function Hero() {
    const { t } = useLanguage()

    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-b from-primary-50/50 to-white">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary-100/30 rounded-full blur-3xl -translate-y-1/2" />
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary-100/30 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                            {t('hero.title_part1')}<span className="text-primary-500">{t('hero.title_part2')}</span>{t('hero.title_part3')}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <SearchBar />
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-12 flex flex-wrap justify-center gap-6 md:gap-12"
                    >
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1.5 rounded-full">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <span className="font-medium">{t('hero.verified_dentists')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-yellow-100 p-1.5 rounded-full">
                                <Star className="h-5 w-5 text-yellow-600" />
                            </div>
                            <span className="font-medium">{t('hero.rating')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-blue-100 p-1.5 rounded-full">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="font-medium">{t('hero.happy_patients')}</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
