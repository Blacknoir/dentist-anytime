"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function CookiesPage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.cookies.title')}
            description={t('pages.cookies.desc')}
        />
    )
}
