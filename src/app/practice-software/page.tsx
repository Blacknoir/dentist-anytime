"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function PracticeSoftwarePage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.practice_software.title')}
            description={t('pages.practice_software.desc')}
        />
    )
}
