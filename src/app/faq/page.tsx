"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function FAQPage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.faq.title')}
            description={t('pages.faq.desc')}
        />
    )
}
