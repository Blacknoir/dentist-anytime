"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Activity, Shield, Smile, Zap, Heart } from "lucide-react"
import Link from "next/link"

const treatments = [
    {
        icon: Sparkles,
        title: "Teeth Whitening",
        description: "Brighten your smile with professional whitening treatments.",
        count: "2,500+ bookings",
    },
    {
        icon: Activity,
        title: "Root Canal",
        description: "Save your natural tooth with painless root canal therapy.",
        count: "1,200+ bookings",
    },
    {
        icon: Shield,
        title: "Dental Implants",
        description: "Permanent solution for missing teeth with natural look.",
        count: "800+ bookings",
    },
    {
        icon: Smile,
        title: "Veneers",
        description: "Transform your smile with custom porcelain veneers.",
        count: "1,500+ bookings",
    },
    {
        icon: Zap,
        title: "Emergency Care",
        description: "Immediate relief for toothaches and dental injuries.",
        count: "3,000+ bookings",
    },
    {
        icon: Heart,
        title: "Checkups & Cleaning",
        description: "Routine care to keep your teeth and gums healthy.",
        count: "10k+ bookings",
    },
]

export function PopularTreatments() {
    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                            Popular Treatments
                        </h2>
                        <p className="text-gray-600 max-w-xl">
                            From routine checkups to complex procedures, find the right care for your needs.
                        </p>
                    </div>
                    <Link
                        href="/services"
                        className="flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors group"
                    >
                        View all treatments
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {treatments.map((treatment, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="group p-6 rounded-2xl border border-gray-100 hover:border-primary-100 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 cursor-pointer bg-white"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <treatment.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {treatment.title}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                                {treatment.description}
                            </p>
                            <div className="flex items-center text-xs font-medium text-gray-400">
                                <Activity className="h-3 w-3 mr-1" />
                                {treatment.count}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
