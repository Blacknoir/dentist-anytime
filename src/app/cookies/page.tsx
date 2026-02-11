"use client"

import React, { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { Cookie, Info, Check, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from "@/lib/LanguageContext"

export default function CookiesPage() {
    const { language } = useLanguage()
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }

    const t_cookies = {
        en: {
            legal: "Legal",
            title: "Cookie Settings",
            subtitle: "Manage how we use cookies to improve your experience.",
            what_title: "What are cookies?",
            what_text: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the owners of the site.",
            manage_title: "Manage Preferences",
            essential_title: "Essential Cookies",
            essential_badge: "Required",
            essential_text: "These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.",
            analytics_title: "Analytics Cookies",
            analytics_text: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. Individual users are not identified.",
            functional_title: "Functional Cookies",
            functional_text: "These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers.",
            marketing_title: "Marketing Cookies",
            marketing_text: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.",
            save_btn: "Save Preferences",
            more_title: "More Information",
            more_text: "For more information about how we use cookies and your choices, please contact us at privacy@dentora.com."
        },
        el: {
            legal: "Νομικά",
            title: "Ρυθμίσεις Cookies",
            subtitle: "Διαχειριστείτε πώς χρησιμοποιούμε τα cookies για να βελτιώσουμε την εμπειρία σας.",
            what_title: "Τι είναι τα cookies;",
            what_text: "Τα cookies είναι μικρά αρχεία κειμένου που τοποθετούνται στον υπολογιστή ή την κινητή συσκευή σας όταν επισκέπτεστε έναν ιστότοπο. Χρησιμοποιούνται ευρέως για να κάνουν τους ιστότοπους να λειτουργούν πιο αποτελεσματικά και να παρέχουν πληροφορίες στους ιδιοκτήτες του ιστότοπου.",
            manage_title: "Διαχείριση Προτιμήσεων",
            essential_title: "Απαραίτητα Cookies",
            essential_badge: "Απαιτείται",
            essential_text: "Αυτά τα cookies είναι απαραίτητα για τη λειτουργία του ιστότοπου και δεν μπορούν να απενεργοποιηθούν. Συνήθως ορίζονται μόνο ως απάντηση σε ενέργειες που γίνονται από εσάς και αφορούν αίτημα για υπηρεσίες, όπως ο καθορισμός των προτιμήσεων απορρήτου, η σύνδεση ή η συμπλήρωση φορμών.",
            analytics_title: "Cookies Ανάλυσης",
            analytics_text: "Αυτά τα cookies μας επιτρέπουν να μετράμε τις επισκέψεις και τις πηγές κυκλοφορίας ώστε να μπορούμε να μετρήσουμε και να βελτιώσουμε την απόδοση του ιστότοπού μας. Οι μεμονωμένοι χρήστες δεν ταυτοποιούνται.",
            functional_title: "Λειτουργικά Cookies",
            functional_text: "Αυτά τα cookies επιτρέπουν στον ιστότοπο να παρέχει βελτιωμένη λειτουργικότητα και εξατομίκευση. Μπορεί να οριστούν από εμάς ή από τρίτους παρόχους.",
            marketing_title: "Cookies Μάρκετινγκ",
            marketing_text: "Αυτά τα cookies μπορεί να οριστούν μέσω του ιστότοπού μας από τους διαφημιστικούς συνεργάτες μας. Μπορεί να χρησιμοποιηθούν από αυτές τις εταιρείες για να δημιουργήσουν ένα προφίλ των ενδιαφερόντων σας και να σας δείξουν σχετικές διαφημίσεις σε άλλους ιστότοπους.",
            save_btn: "Αποθήκευση Προτιμήσεων",
            more_title: "Περισσότερες Πληροφορίες",
            more_text: "Για περισσότερες πληροφορίες σχετικά με το πώς χρησιμοποιούμε τα cookies και τις επιλογές σας, επικοινωνήστε μαζί μας στο privacy@dentora.com."
        }
    }

    const text = language === 'el' ? t_cookies.el : t_cookies.en

    const [preferences, setPreferences] = useState({
        essential: true,
        analytics: true,
        marketing: false,
        functional: true
    })

    const handleToggle = (key: keyof typeof preferences) => {
        if (key === 'essential') return // Cannot toggle essential
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-primary-50 p-8 md:p-12 border-b border-gray-100">
                        <motion.div
                            initial={fadeIn.initial}
                            animate={fadeIn.animate}
                            transition={fadeIn.transition}
                            className="flex items-center gap-4 mb-4"
                        >
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <Cookie className="h-8 w-8 text-primary-600" />
                            </div>
                            <span className="text-primary-600 font-bold tracking-wider uppercase text-sm">{text.legal}</span>
                        </motion.div>
                        <motion.h1
                            initial={{ ...fadeIn.initial, transition: { delay: 0.1 } }}
                            animate={fadeIn.animate}
                            className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4"
                        >
                            {text.title}
                        </motion.h1>
                        <motion.p
                            initial={{ ...fadeIn.initial, transition: { delay: 0.2 } }}
                            animate={fadeIn.animate}
                            className="text-gray-600 text-lg md:text-xl max-w-2xl"
                        >
                            {text.subtitle}
                        </motion.p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.what_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.what_text}
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.manage_title}
                            </h2>
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100">
                                {/* Essential Cookies */}
                                <div className="p-6 flex items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900">{text.essential_title}</h3>
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{text.essential_badge}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {text.essential_text}
                                        </p>
                                    </div>
                                    <Switch checked={true} disabled />
                                </div>

                                {/* Analytics Cookies */}
                                <div className="p-6 flex items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900">{text.analytics_title}</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {text.analytics_text}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.analytics}
                                        onCheckedChange={() => handleToggle('analytics')}
                                    />
                                </div>

                                {/* Functional Cookies */}
                                <div className="p-6 flex items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900">{text.functional_title}</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {text.functional_text}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.functional}
                                        onCheckedChange={() => handleToggle('functional')}
                                    />
                                </div>

                                {/* Marketing Cookies */}
                                <div className="p-6 flex items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-gray-900">{text.marketing_title}</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            {text.marketing_text}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.marketing}
                                        onCheckedChange={() => handleToggle('marketing')}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary-200">
                                    {text.save_btn}
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.more_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.more_text}
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
