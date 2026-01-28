"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function TermsPage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.terms.title')}
            description={t('pages.terms.desc')}
        />
    )
}
