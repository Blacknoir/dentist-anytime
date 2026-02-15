"use client"

import React from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { Trash2, Shield, Mail, ArrowRight } from 'lucide-react'
import { useLanguage } from "@/lib/LanguageContext"
import Link from 'next/link'

export default function DataDeletionPage() {
    const { language } = useLanguage()

    const content = {
        en: {
            title: "Data Deletion Instructions",
            subtitle: "How to request the deletion of your personal data from Dentora.",
            intro: "According to Facebook Platform rules, we must provide a Data Deletion Callback URL or Data Deletion Instructions URL. If you want to delete your activities for Dentora, you can follow these steps:",
            steps: [
                "Go to your Facebook Account's Settings & Privacy. Click Settings.",
                "Look for 'Apps and Websites' and you will see all of the apps and websites you linked with your Facebook.",
                "Search and Click 'Dentora' in the search bar.",
                "Scroll and click 'Remove'.",
                "Congratulations, you have succesfully removed your app activities."
            ],
            manual_title: "Manual Data Deletion Request",
            manual_text: "If you wish to delete your account and all associated data directly from our database, please contact us via email. We will process your request within 48 hours.",
            email_label: "Contact Email",
            email: "dentoraservices@gmail.com",
            back_home: "Back to Home"
        },
        el: {
            title: "Οδηγίες Διαγραφής Δεδομένων",
            subtitle: "Πώς να ζητήσετε τη διαγραφή των προσωπικών σας δεδομένων από το Dentora.",
            intro: "Σύμφωνα με τους κανόνες της πλατφόρμας του Facebook, πρέπει να παρέχουμε μια διεύθυνση URL ανάκλησης διαγραφής δεδομένων ή οδηγίες διαγραφής δεδομένων. Εάν θέλετε να διαγράψετε τις δραστηριότητές σας για το Dentora, μπορείτε να ακολουθήσετε τα εξής βήματα:",
            steps: [
                "Μεταβείτε στις Ρυθμίσεις και το Απόρρητο του λογαριασμού σας στο Facebook. Κάντε κλικ στις Ρυθμίσεις.",
                "Αναζητήστε το 'Εφαρμογές και ιστότοποι' και θα δείτε όλες τις εφαρμογές και τους ιστότοπους που έχετε συνδέσει με το Facebook σας.",
                "Αναζητήστε και κάντε κλικ στο 'Dentora' στη γραμμή αναζήτησης.",
                "Μετακινηθείτε προς τα κάτω και κάντε κλικ στο 'Αφαίρεση'.",
                "Συγχαρητήρια, αφαιρέσατε με επιτυχία τις δραστηριότητες της εφαρμογής σας."
            ],
            manual_title: "Μη αυτόματο αίτημα διαγραφής δεδομένων",
            manual_text: "Εάν επιθυμείτε να διαγράψετε τον λογαριασμό σας και όλα τα σχετικά δεδομένα απευθείας από τη βάση δεδομένων μας, επικοινωνήστε μαζί μας μέσω email. Θα επεξεργαστούμε το αίτημά σας εντός 48 ωρών.",
            email_label: "Email Επικοινωνίας",
            email: "dentoraservices@gmail.com",
            back_home: "Επιστροφή στην Αρχική"
        }
    }

    const text = language === 'el' ? content.el : content.en

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="bg-red-50 p-8 border-b border-red-100 text-center">
                            <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                <Trash2 className="h-8 w-8 text-red-600" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{text.title}</h1>
                            <p className="text-gray-600">{text.subtitle}</p>
                        </div>

                        {/* Content Section */}
                        <div className="p-8 md:p-12 space-y-10">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-primary-600 font-bold uppercase text-sm tracking-wider">
                                    <Shield className="h-4 w-4" />
                                    Facebook Integration
                                </div>
                                <p className="text-gray-600 leading-relaxed italic">
                                    "{text.intro}"
                                </p>

                                <div className="space-y-4 mt-6">
                                    {text.steps.map((step, i) => (
                                        <div key={i} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-bold text-gray-500">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-700 pt-1">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <hr className="border-gray-100" />

                            <section className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary-600" />
                                    {text.manual_title}
                                </h2>
                                <p className="text-gray-600 mb-6">
                                    {text.manual_text}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{text.email_label}</p>
                                        <p className="text-lg font-bold text-primary-600">{text.email}</p>
                                    </div>
                                    <Link href={`mailto:${text.email}`}>
                                        <button className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-100 flex items-center gap-2">
                                            Send Email
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </Link>
                                </div>
                            </section>

                            <div className="text-center pt-4">
                                <Link
                                    href="/"
                                    className="text-gray-500 hover:text-primary-600 font-medium transition-colors"
                                >
                                    {text.back_home}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
