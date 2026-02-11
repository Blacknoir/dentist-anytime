"use client"

import React from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { Scale, CheckCircle, AlertCircle } from 'lucide-react'
import { useLanguage } from "@/lib/LanguageContext"

export default function TermsPage() {
    const { language } = useLanguage()
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }

    const t_terms = {
        en: {
            legal: "Legal",
            title: "Terms of Service",
            subtitle: "Please read these terms carefully before using our services.",
            last_updated: "Last Updated: October 24, 2025",
            agreement_title: "1. Agreement to Terms",
            agreement_text: "By accessing our website at dentora.com and using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.",
            license_title: "2. Use License",
            license_text: "Permission is granted to temporarily download one copy of the materials (information or software) on Dentora's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:",
            license_list: [
                "Modify or copy the materials",
                "Use the materials for any commercial purpose",
                "Attempt to decompile or reverse engineer any software",
                "Remove any copyright or other proprietary notations",
                "Transfer the materials to another person"
            ],
            disclaimer_title: "3. Medical Disclaimer",
            disclaimer_text: "The contents of the Dentora Site, such as text, graphics, images, and other material contained on the Dentora Site (\"Content\") are for informational purposes only. The Content is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your dentist, physician or other qualified health provider with any questions you may have regarding a medical condition.",
            responsibilities_title: "4. User Responsibilities",
            responsibilities_text: "As a user of the Service, you agree to:",
            responsibilities_list: [
                "Provide accurate and complete registration information",
                "Maintain the security of your password and identification",
                "Maintain and promptly update the registration data",
                "Accept all risks of unauthorized access to the registration data"
            ],
            appointments_title: "5. Appointments and Cancellations",
            appointments_text1: "Dentora provides a platform to schedule appointments with dental professionals. While we facilitate the booking process, the actual appointment is an agreement between you and the dental professional.",
            appointments_text2: "Cancellation policies are determined by individual dental practices. Please review the specific cancellation policy of the dentist you are booking with. Failure to attend scheduled appointments may result in fees as determined by the dental practice.",
            limitations_title: "6. Limitations",
            limitations_text: "In no event shall Dentora or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Dentora's website.",
            governing_title: "7. Governing Law",
            governing_text: "These terms and conditions are governed by and construed in accordance with the laws of Greece and the European Union. You irrevocably submit to the exclusive jurisdiction of the courts in Athens, Greece."
        },
        el: {
            legal: "Νομικά",
            title: "Όροι Χρήσης",
            subtitle: "Παρακαλούμε διαβάστε προσεκτικά αυτούς τους όρους πριν χρησιμοποιήσετε τις υπηρεσίες μας.",
            last_updated: "Τελευταία Ενημέρωση: 24 Οκτωβρίου 2025",
            agreement_title: "1. Συμφωνία με τους Όρους",
            agreement_text: "Με την πρόσβαση στον ιστότοπό μας στο dentora.com και τη χρήση των υπηρεσιών μας, συμφωνείτε να δεσμεύεστε από αυτούς τους Όρους Χρήσης και όλους τους ισχύοντες νόμους και κανονισμούς. Εάν δεν συμφωνείτε με κάποιον από αυτούς τους όρους, απαγορεύεται η χρήση ή η πρόσβαση σε αυτόν τον ιστότοπο.",
            license_title: "2. Άδεια Χρήσης",
            license_text: "Χορηγείται άδεια για προσωρινή λήψη ενός αντιγράφου του υλικού (πληροφορίες ή λογισμικό) στον ιστότοπο της Dentora μόνο για προσωπική, μη εμπορική, παροδική προβολή. Αυτή είναι η χορήγηση άδειας, όχι μεταβίβαση τίτλου, και βάσει αυτής της άδειας δεν επιτρέπεται να:",
            license_list: [
                "Τροποποιήσετε ή αντιγράψετε το υλικό",
                "Χρησιμοποιήσετε το υλικό για οποιονδήποτε εμπορικό σκοπό",
                "Προσπαθήσετε να αποσυμπιλήσετε ή να αναστρέψετε τη μηχανική οποιουδήποτε λογισμικού",
                "Αφαιρέσετε οποιαδήποτε πνευματικά δικαιώματα ή άλλες ιδιοκτησιακές σημειώσεις",
                "Μεταφέρετε το υλικό σε άλλο άτομο"
            ],
            disclaimer_title: "3. Ιατρική Αποποίηση Ευθύνης",
            disclaimer_text: "Τα περιεχόμενα του Ιστότοπου Dentora, όπως κείμενο, γραφικά, εικόνες και άλλο υλικό που περιέχεται στον Ιστότοπο Dentora («Περιεχόμενο») προορίζονται μόνο για ενημερωτικούς σκοπούς. Το Περιεχόμενο δεν προορίζεται να υποκαταστήσει επαγγελματικές ιατρικές συμβουλές, διάγνωση ή θεραπεία. Ζητάτε πάντα τη συμβουλή του οδοντιάτρου, του ιατρού ή άλλου εξειδικευμένου παρόχου υγείας για τυχόν ερωτήσεις που μπορεί να έχετε σχετικά με μια ιατρική πάθηση.",
            responsibilities_title: "4. Ευθύνες Χρήστη",
            responsibilities_text: "Ως χρήστης της Υπηρεσίας, συμφωνείτε να:",
            responsibilities_list: [
                "Παρέχετε ακριβείς και πλήρεις πληροφορίες εγγραφής",
                "Διατηρείτε την ασφάλεια του κωδικού πρόσβασης και της αναγνώρισης σας",
                "Διατηρείτε και ενημερώνετε έγκαιρα τα δεδομένα εγγραφής",
                "Αποδέχεστε όλους τους κινδύνους μη εξουσιοδοτημένης πρόσβασης στα δεδομένα εγγραφής"
            ],
            appointments_title: "5. Ραντεβού και Ακυρώσεις",
            appointments_text1: "Η Dentora παρέχει μια πλατφόρμα για τον προγραμματισμό ραντεβού με επαγγελματίες οδοντιάτρους. Ενώ διευκολύνουμε τη διαδικασία κράτησης, το πραγματικό ραντεβού είναι μια συμφωνία μεταξύ εσάς και του επαγγελματία οδοντιάτρου.",
            appointments_text2: "Οι πολιτικές ακύρωσης καθορίζονται από τα μεμονωμένα οδοντιατρεία. Παρακαλούμε διαβάστε τη συγκεκριμένη πολιτική ακύρωσης του οδοντιάτρου με τον οποίο κάνετε κράτηση. Η μη προσέλευση σε προγραμματισμένα ραντεβού ενδέχεται να οδηγήσει σε χρεώσεις όπως καθορίζονται από το οδοντιατρείο.",
            limitations_title: "6. Περιορισμοί",
            limitations_text: "Σε καμία περίπτωση η Dentora ή οι προμηθευτές της δεν ευθύνονται για τυχόν ζημίες (συμπεριλαμβανομένων, ενδεικτικά, ζημιών λόγω απώλειας δεδομένων ή κέρδους ή λόγω διακοπής της επιχείρησης) που προκύπτουν από τη χρήση ή την αδυναμία χρήσης του υλικού στον ιστότοπο της Dentora.",
            governing_title: "7. Εφαρμοστέο Δίκαιο",
            governing_text: "Αυτοί οι όροι και προϋποθέσεις διέπονται και ερμηνεύονται σύμφωνα με τους νόμους της Ελλάδας και της Ευρωπαϊκής Ένωσης και υποβάλλεστε αμετάκλητα στην αποκλειστική δικαιοδοσία των δικαστηρίων της Αθήνας."
        }
    }

    const text = language === 'el' ? t_terms.el : t_terms.en

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
                                <Scale className="h-8 w-8 text-primary-600" />
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
                        <motion.p
                            initial={{ ...fadeIn.initial, transition: { delay: 0.3 } }}
                            animate={fadeIn.animate}
                            className="text-sm text-gray-500 mt-6"
                        >
                            {text.last_updated}
                        </motion.p>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 space-y-12">
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.agreement_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.agreement_text}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.license_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.license_text}
                            </p>
                            <ul className="space-y-3 mt-4">
                                {text.license_list.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="mt-1">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.disclaimer_title}
                            </h2>
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                                <p className="text-amber-900 text-sm leading-relaxed font-medium">
                                    {text.disclaimer_text}
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.responsibilities_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.responsibilities_text}
                            </p>
                            <ul className="space-y-3">
                                {text.responsibilities_list.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-gray-600">
                                        <div className="mt-1">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.appointments_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.appointments_text1}
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                {text.appointments_text2}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.limitations_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.limitations_text}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.governing_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.governing_text}
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
