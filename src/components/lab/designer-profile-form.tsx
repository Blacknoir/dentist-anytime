"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateDesignerProfile, updateDesignerServices, updateLabProfile } from "@/app/actions/lab-designer"

type Service = {
    id?: string
    name: string
    description: string
    price: number
    leadTimeDays: number
    minUnits: number
}

type DesignerData = {
    headline: string
    bio: string
    city: string
    services: Service[]
}

type LabData = {
    labName: string
    city: string
    about: string
    equipment: string[]
    materials: string[]
}

export function DesignerProfileForm({
    designer,
    lab,
}: {
    designer: DesignerData | null
    lab: LabData | null
}) {
    const router = useRouter()
    const [profile, setProfile] = useState(designer)
    const [labProfile, setLabProfile] = useState(lab)
    const [services, setServices] = useState<Service[]>(designer?.services ?? [])
    const [pending, setPending] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const saveProfile = async () => {
        setPending(true)
        setMessage(null)
        setError(null)
        try {
            if (profile) {
                await updateDesignerProfile({
                    headline: profile.headline,
                    bio: profile.bio,
                    city: profile.city,
                })
            }
            if (labProfile) {
                await updateLabProfile({
                    labName: labProfile.labName,
                    city: labProfile.city,
                    about: labProfile.about,
                    equipment: labProfile.equipment,
                    materials: labProfile.materials,
                })
            }
            setMessage("Το προφίλ αποθηκεύτηκε.")
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η αποθήκευση απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    const saveServices = async () => {
        setPending(true)
        setMessage(null)
        setError(null)
        try {
            await updateDesignerServices(services)
            setMessage("Οι υπηρεσίες αποθηκεύτηκαν.")
            router.refresh()
        } catch (err: any) {
            setError(err?.message || "Η αποθήκευση απέτυχε.")
        } finally {
            setPending(false)
        }
    }

    const updateService = (index: number, patch: Partial<Service>) => {
        setServices((prev) => prev.map((service, i) => (i === index ? { ...service, ...patch } : service)))
    }

    return (
        <div className="mt-8 space-y-6">
            {profile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Στοιχεία designer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="headline">Ειδικότητα</Label>
                            <Input
                                id="headline"
                                value={profile.headline}
                                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                                placeholder="π.χ. CAD Designer · Zirconia & implant guided surgery"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city">Πόλη</Label>
                            <Input
                                id="city"
                                value={profile.city}
                                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                placeholder="π.χ. Αθήνα"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="bio">Παρουσίαση</Label>
                            <Textarea
                                id="bio"
                                rows={5}
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Εμπειρία, ειδικεύσεις, λογισμικά, τύποι εργασιών που δουλεύεις…"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {labProfile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Στοιχεία εργαστηρίου</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="labName">Όνομα εργαστηρίου</Label>
                            <Input
                                id="labName"
                                value={labProfile.labName}
                                onChange={(e) => setLabProfile({ ...labProfile, labName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="labCity">Πόλη</Label>
                            <Input
                                id="labCity"
                                value={labProfile.city}
                                onChange={(e) => setLabProfile({ ...labProfile, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="labAbout">Παρουσίαση</Label>
                            <Textarea
                                id="labAbout"
                                rows={4}
                                value={labProfile.about}
                                onChange={(e) => setLabProfile({ ...labProfile, about: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Εξοπλισμός (comma separated)</Label>
                            <Input
                                value={labProfile.equipment.join(", ")}
                                onChange={(e) =>
                                    setLabProfile({
                                        ...labProfile,
                                        equipment: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Υλικά (comma separated)</Label>
                            <Input
                                value={labProfile.materials.join(", ")}
                                onChange={(e) =>
                                    setLabProfile({
                                        ...labProfile,
                                        materials: e.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                                    })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {(profile || labProfile) && (
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={saveProfile} disabled={pending}>
                        {pending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                        Αποθήκευση προφίλ
                    </Button>
                    {message && <span className="text-sm text-green-700">{message}</span>}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                </div>
            )}

            {profile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Υπηρεσίες & τιμές</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {services.length === 0 && (
                            <p className="text-sm text-gray-500">
                                Δεν έχεις δηλώσει υπηρεσίες. Πρόσθεσε την πρώτη σου — οι πελάτες βλέπουν τις τιμές
                                στο προφίλ σου.
                            </p>
                        )}

                        {services.map((service, index) => (
                            <div key={service.id ?? `new-${index}`} className="border border-gray-200 rounded-2xl p-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Υπηρεσία</Label>
                                        <Input
                                            value={service.name}
                                            onChange={(e) => updateService(index, { name: e.target.value })}
                                            placeholder="π.χ. Στεφάνη Zirconia"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Τιμή (€)</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={service.price}
                                            onChange={(e) => updateService(index, { price: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Χρόνος παράδοσης (ημέρες)</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={service.leadTimeDays}
                                            onChange={(e) =>
                                                updateService(index, { leadTimeDays: Number(e.target.value) })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Ελάχιστα τεμάχια</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={service.minUnits}
                                            onChange={(e) => updateService(index, { minUnits: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Περιγραφή</Label>
                                    <Textarea
                                        rows={2}
                                        value={service.description}
                                        onChange={(e) => updateService(index, { description: e.target.value })}
                                        placeholder="Τι περιλαμβάνει (π.χ. σχέδιο + STL + οδηγίες εκτύπωσης)"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600"
                                        onClick={() => setServices((prev) => prev.filter((_, i) => i !== index))}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" /> Αφαίρεση
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setServices((prev) => [
                                    ...prev,
                                    { name: "", description: "", price: 80, leadTimeDays: 3, minUnits: 1 },
                                ])
                            }
                        >
                            <Plus className="h-4 w-4 mr-1" /> Προσθήκη υπηρεσίας
                        </Button>

                        <div className="pt-2">
                            <Button onClick={saveServices} disabled={pending}>
                                {pending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Check className="h-4 w-4 mr-2" />
                                )}
                                Αποθήκευση υπηρεσιών
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
