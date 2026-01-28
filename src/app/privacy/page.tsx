"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function PrivacyPage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.privacy.title')}
            description={t('pages.privacy.desc')}
        />
    )
}
