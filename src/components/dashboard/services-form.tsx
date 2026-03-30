"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Clock, Euro, PlusCircle, Trash2, Plus } from "lucide-react"
import { updateDentistServices } from "@/app/actions/dashboard"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/LanguageContext"

export function ServicesForm({ initialData }: { initialData: any[] }) {
    const router = useRouter()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(false)
    const [services, setServices] = useState(initialData || [])

    const addService = () => {
        setServices([...services, { id: 'new-' + Date.now(), name: '', price: 0, duration: 30 }])
    }

    const removeService = (id: string) => {
        setServices(services.filter(s => s.id !== id))
    }

    const updateService = (id: string, field: string, value: any) => {
        setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateDentistServices(services)
            router.refresh()
            alert(t('services.updated'))
        } catch (error) {
            console.error(error)
            alert(t('services.failed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('services.title')}</h1>
                    <p className="text-gray-500">{t('services.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={addService} className="gap-2">
                        <Plus className="h-4 w-4" /> {t('services.add')}
                    </Button>
                    <Button type="submit" disabled={loading} className="gap-2">
                        {loading ? t('profile.saving') : <><Save className="h-4 w-4" /> {t('profile.save_changes')}</>}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {services.length > 0 ? (
                    services.map((service, index) => (
                        <Card key={service.id} className="border-none shadow-sm group">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                    <div className="md:col-span-5 space-y-2">
                                        <Label>{t('services.name')}</Label>
                                        <Input
                                            placeholder={t('services.name_placeholder')}
                                            value={service.name}
                                            onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>{t('services.price')}</Label>
                                        <div className="relative">
                                            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="number"
                                                className="pl-10"
                                                value={service.price}
                                                onChange={(e) => updateService(service.id, 'price', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>{t('services.duration')}</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                type="number"
                                                className="pl-10"
                                                value={service.duration}
                                                onChange={(e) => updateService(service.id, 'duration', parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeService(service.id)}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">{t('services.no_services')}</p>
                    </div>
                )}
            </div>
        </form>
    )
}
