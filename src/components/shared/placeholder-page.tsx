"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"
import Link from "next/link"

interface PlaceholderPageProps {
    title: string
    description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Construction className="h-10 w-10 text-primary-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {description}
                    </p>
                    <Link href="/">
                        <Button size="lg">Return Home</Button>
                    </Link>
                </div>
            </main>
            <Footer />
        </div>
    )
}
