"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Lock } from "lucide-react"
import { Logo } from "@/components/shared/logo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/LanguageContext"

export function Footer() {
    const { t } = useLanguage()

    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Logo />
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('footer.description')}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <Link
                                href="https://www.facebook.com/share/1HoEkjizzv/?mibextid=wwXIfr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link
                                href="https://www.instagram.com/dentora_app?igsh=ajVvZ2M3OW93Ynli&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                            >
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link
                                href="https://www.tiktok.com/@dentora.app?_r=1&_t=ZN-93l4UfI4irm"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-primary-500 transition-colors"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">{t('footer.for_patients')}</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/search" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.find_dentist')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/services" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.browse_treatments')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.blog')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.faq')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Dentists */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">{t('footer.for_dentists')}</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/for-dentists" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.join_network')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/practice-software" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.practice_software')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/success-stories" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.success_stories')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/dentist-login" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    {t('footer.dentist_login')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/login" className="text-gray-400 hover:text-primary-500 text-xs transition-colors flex items-center gap-1 opacity-50 hover:opacity-100 italic">
                                    <Lock className="h-3 w-3" /> admin
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} Dentora. {t('footer.rights')}
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            {t('footer.privacy')}
                        </Link>
                        <Link href="/terms" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            {t('footer.terms')}
                        </Link>
                        <Link href="/cookies" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            {t('footer.cookies')}
                        </Link>
                        <Link href="/data-deletion" className="text-gray-400 hover:text-gray-600 text-[10px] uppercase font-bold tracking-wider transition-colors">
                            Data Deletion
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
