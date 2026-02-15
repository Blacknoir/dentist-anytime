"use client"

import React from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, FileText } from 'lucide-react'
import { useLanguage } from "@/lib/LanguageContext"

export default function PrivacyPage() {
    const { language } = useLanguage()
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }

    const t_privacy = {
        en: {
            legal: "Legal",
            title: "Privacy Policy",
            subtitle: "We are committed to protecting your personal information and your right to privacy.",
            last_updated: "Last Updated: October 24, 2025",
            intro_title: "1. Introduction",
            intro_text1: "Welcome to Dentora (\"Company\", \"we\", \"our\", \"us\"). We appreciate that you trust us with your personal information. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at dentoraservices@gmail.com.",
            intro_text2: "This privacy notice describes how we might use your information if you:",
            intro_list1: "Visit our website at dentora.com",
            intro_list2: "Engage with us in other related ways, including any sales, marketing, or events",
            info_title: "2. Information We Collect",
            info_personal_title: "Personal Information You Disclose to Us",
            info_personal_text: "We collect personal information that you voluntarily provide to us when you register on the Website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website or otherwise when you contact us.",
            info_auto_title: "Information Automatically Collected",
            info_auto_text: "Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Website. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Website and other technical information.",
            use_title: "3. How We Use Your Information",
            use_text: "We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.",
            use_list: [
                "To facilitate account creation and logon process",
                "To post testimonials",
                "To request feedback",
                "To enable user-to-user communications",
                "To manage user accounts",
                "To send administrative information to you",
                "To protect our Services",
                "To enforce our terms, conditions and policies"
            ],
            sharing_title: "4. Information Sharing",
            sharing_text: "We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share your data that we hold based on the following legal basis:",
            sharing_consent_title: "Consent",
            sharing_consent_text: "We may process your data if you have given us specific consent to use your personal information for a specific purpose.",
            sharing_interest_title: "Legitimate Interests",
            sharing_interest_text: "We may process your data when it is reasonably necessary to achieve our legitimate business interests.",
            contact_title: "5. Contact Us",
            contact_text: "If you have questions or comments about this policy, you may email us at dentoraservices@gmail.com or by post to:",
            address_text: "Katerini, PC 60100\nGreece"
        },
        el: {
            legal: "Νομικά",
            title: "Πολιτική Απορρήτου",
            subtitle: "Δεσμευόμαστε να προστατεύουμε τα προσωπικά σας δεδομένα και το δικαίωμά σας στο απόρρητο.",
            last_updated: "Τελευταία Ενημέρωση: 24 Οκτωβρίου 2025",
            intro_title: "1. Εισαγωγή",
            intro_text1: "Καλώς ήρθατε στο Dentora («Εταιρεία», «εμείς», «μας»). Εκτιμούμε που μας εμπιστεύεστε τα προσωπικά σας δεδομένα. Εάν έχετε ερωτήσεις ή ανησυχίες σχετικά με αυτήν την ειδοποίηση απορρήτου ή τις πρακτικές μας όσον αφορά τα προσωπικά σας δεδομένα, επικοινωνήστε μαζί μας στο dentoraservices@gmail.com.",
            intro_text2: "Αυτή η ειδοποίηση απορρήτου περιγράφει πώς ενδέχεται να χρησιμοποιήσουμε τις πληροφορίες σας εάν εσείς:",
            intro_list1: "Επισκεφθείτε τον ιστότοπό μας στο dentora.com",
            intro_list2: "Αλληλεπιδράσετε μαζί μας με άλλους σχετικούς τρόπους, συμπεριλαμβανομένων πωλήσεων, μάρκετινγκ ή εκδηλώσεων",
            info_title: "2. Πληροφορίες που Συλλέγουμε",
            info_personal_title: "Προσωπικές Πληροφορίες που μας Αποκαλύπτετε",
            info_personal_text: "Συλλέγουμε προσωπικές πληροφορίες που μας παρέχετε οικειοθελώς όταν εγγράφεστε στον Ιστότοπο, εκδηλώνετε ενδιαφέρον για να λάβετε πληροφορίες για εμάς ή τα προϊόντα και τις Υπηρεσίες μας, όταν συμμετέχετε σε δραστηριότητες στον Ιστότοπο ή διαφορετικά όταν επικοινωνείτε μαζί μας.",
            info_auto_title: "Πληροφορίες που Συλλέγονται Αυτόματα",
            info_auto_text: "Ορισμένες πληροφορίες — όπως η διεύθυνση IP και/ή τα χαρακτηριστικά του προγράμματος περιήγησης και της συσκευής — συλλέγονται αυτόματα όταν επισκέπτεστε τον Ιστότοπό μας. Αυτές οι πληροφορίες δεν αποκαλύπτουν τη συγκεκριμένη ταυτότητά σας (όπως το όνομα ή τα στοιχεία επικοινωνίας σας) αλλά μπορεί να περιλαμβάνουν πληροφορίες συσκευής και χρήσης, όπως τη διεύθυνση IP, χαρακτηριστικά προγράμματος περιήγησης και συσκευής, λειτουργικό σύστημα, προτιμήσεις γλώσσας, διευθύνσεις URL παραπομπής, όνομα συσκευής, χώρα, τοποθεσία, πληροφορίες σχετικά με το πώς και πότε χρησιμοποιείτε τον Ιστότοπό μας και άλλες τεχνικές πληροφορίες.",
            use_title: "3. Πώς Χρησιμοποιούμε τις Πληροφορίες σας",
            use_text: "Χρησιμοποιούμε προσωπικές πληροφορίες που συλλέγονται μέσω του Ιστότοπού μας για διάφορους επιχειρηματικούς σκοπούς που περιγράφονται παρακάτω. Επεξεργαζόμαστε τις προσωπικές σας πληροφορίες για αυτούς τους σκοπούς βασιζόμενοι στα νόμιμα επιχειρηματικά μας συμφέροντα, προκειμένου να συνάψουμε ή να εκτελέσουμε σύμβαση μαζί σας, με τη συγκατάθεσή σας και/ή για συμμόρφωση με τις νομικές μας υποχρεώσεις.",
            use_list: [
                "Για τη διευκόλυνση της διαδικασίας δημιουργίας λογαριασμού και σύνδεσης",
                "Για δημοσίευση μαρτυριών",
                "Για αίτηση σχολίων",
                "Για ενεργοποίηση επικοινωνίας μεταξύ χρηστών",
                "Για διαχείριση λογαριασμών χρηστών",
                "Για αποστολή διοικητικών πληροφοριών σε εσάς",
                "Για προστασία των Υπηρεσιών μας",
                "Για επιβολή των όρων, προϋποθέσεων και πολιτικών μας"
            ],
            sharing_title: "4. Κοινοποίηση Πληροφοριών",
            sharing_text: "Μοιραζόμαστε πληροφορίες μόνο με τη συγκατάθεσή σας, για συμμόρφωση με τους νόμους, για παροχή υπηρεσιών σε εσάς, για προστασία των δικαιωμάτων σας ή για εκπλήρωση επιχειρηματικών υποχρεώσεων. Μπορεί να επεξεργαστούμε ή να μοιραστούμε τα δεδομένα σας που διατηρούμε βάσει της ακόλουθης νομικής βάσης:",
            sharing_consent_title: "Συγκατάθεση",
            sharing_consent_text: "Μπορούμε να επεξεργαστούμε τα δεδομένα σας εάν μας έχετε δώσει συγκεκριμένη συγκατάθεση για τη χρήση των προσωπικών σας πληροφοριών για συγκεκριμένο σκοπό.",
            sharing_interest_title: "Νόμιμα Συμφέροντα",
            sharing_interest_text: "Μπορούμε να επεξεργαστούμε τα δεδομένα σας όταν είναι εύλογα απαραίτητο για την επίτευξη των νόμιμων επιχειρηματικών μας συμφερόντων.",
            contact_title: "5. Επικοινωνήστε Μαζί Μας",
            contact_text: "Εάν έχετε ερωτήσεις ή σχόλια σχετικά με αυτήν την πολιτική, μπορείτε να μας στείλετε email στο dentoraservices@gmail.com ή ταχυδρομικά στη διεύθυνση:",
            address_text: "Κατερίνη, ΤΚ 60100\nΕλλάδα"
        }
    }

    const text = language === 'el' ? t_privacy.el : t_privacy.en

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
                                <Shield className="h-8 w-8 text-primary-600" />
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
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {text.intro_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.intro_text1}
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                {text.intro_text2}
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-600">
                                <li>{text.intro_list1}</li>
                                <li>{text.intro_list2}</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.info_title}
                            </h2>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-primary-500" />
                                        {text.info_personal_title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {text.info_personal_text}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary-500" />
                                        {text.info_auto_title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {text.info_auto_text}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.use_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.use_text}
                            </p>
                            <ul className="grid md:grid-cols-2 gap-4 mt-4">
                                {text.use_list.map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.sharing_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.sharing_text}
                            </p>
                            <div className="space-y-4 mt-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{text.sharing_consent_title}</h3>
                                        <p className="text-gray-600 text-sm">{text.sharing_consent_text}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-green-50 rounded-lg text-green-600 shrink-0">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{text.sharing_interest_title}</h3>
                                        <p className="text-gray-600 text-sm">{text.sharing_interest_text}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {text.contact_title}
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                {text.contact_text}
                            </p>
                            <address className="not-italic text-gray-600 bg-gray-50 p-6 rounded-xl border border-gray-100 inline-block">
                                <strong>Dentora Inc.</strong><br />
                                Antoniadou 18<br />
                                {text.address_text}
                            </address>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
