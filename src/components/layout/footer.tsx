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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Logo />
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('footer.description')}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <Link href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Facebook className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Linkedin className="h-5 w-5" />
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

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">{t('footer.stay_updated')}</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {t('footer.newsletter_desc')}
                        </p>
                        <div className="flex flex-col gap-2">
                            <Input placeholder={t('footer.email_placeholder')} className="bg-white" />
                            <Button>{t('footer.subscribe')}</Button>
                        </div>
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
                    </div>
                </div>
            </div>
        </footer>
    )
}
