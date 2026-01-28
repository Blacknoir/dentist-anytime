"use client"

import PlaceholderPage from "@/components/shared/placeholder-page"
import { useLanguage } from "@/lib/LanguageContext"

export default function SuccessStoriesPage() {
    const { t } = useLanguage()

    return (
        <PlaceholderPage
            title={t('pages.success_stories.title')}
            description={t('pages.success_stories.desc')}
        />
    )
}
