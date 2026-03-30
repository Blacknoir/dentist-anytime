"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { deleteAccount, signOut } from "@/app/actions/auth"
import { useLanguage } from "@/lib/LanguageContext"

export default function SettingsPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [isDeleting, setIsDeleting] = React.useState(false)

    const handleDelete = async () => {
        if (window.confirm(t('settings.delete_confirm'))) {
            setIsDeleting(true)
            try {
                await deleteAccount()
                await signOut()
                router.push("/")
            } catch (error) {
                console.error("Error deleting account", error)
                alert(t('settings.delete_error'))
            } finally {
                setIsDeleting(false)
            }
        }
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
                <p className="text-gray-500">{t('settings.subtitle')}</p>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">{t('settings.email_notif')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>{t('settings.new_bookings')}</Label>
                            <p className="text-sm text-gray-500">{t('settings.new_bookings_desc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="space-y-0.5">
                            <Label>{t('settings.reminders')}</Label>
                            <p className="text-sm text-gray-500">{t('settings.reminders_desc')}</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-red-600">{t('settings.danger_zone')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>{t('settings.delete_account')}</Label>
                            <p className="text-sm text-gray-500">{t('settings.delete_account_desc')}</p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t('settings.deleting') : t('settings.delete_account')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
