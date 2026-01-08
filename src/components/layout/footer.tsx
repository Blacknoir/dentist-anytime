import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Stethoscope } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-500 text-white p-2 rounded-lg">
                                <Stethoscope className="h-6 w-6" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                                Dentist<span className="text-primary-500">Anytime</span>
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            The world's leading platform for finding and booking the best dental care.
                            Simple, transparent, and trusted by millions.
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
                        <h3 className="font-semibold text-gray-900 mb-4">For Patients</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/search" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Find a Dentist
                                </Link>
                            </li>
                            <li>
                                <Link href="/services" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Browse Treatments
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Dental Health Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Patient FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Dentists */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">For Dentists</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/for-dentists" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Join Our Network
                                </Link>
                            </li>
                            <li>
                                <Link href="/practice-software" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Practice Software
                                </Link>
                            </li>
                            <li>
                                <Link href="/success-stories" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Success Stories
                                </Link>
                            </li>
                            <li>
                                <Link href="/dentist-login" className="text-gray-500 hover:text-primary-500 text-sm transition-colors">
                                    Dentist Login
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Stay Updated</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Subscribe to our newsletter for the latest dental health tips and offers.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Input placeholder="Enter your email" className="bg-white" />
                            <Button>Subscribe</Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} DentistAnytime. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            Terms of Service
                        </Link>
                        <Link href="/cookies" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                            Cookie Settings
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
