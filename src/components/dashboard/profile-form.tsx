"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/LanguageContext"
import { ShieldCheck, Upload, Save } from "lucide-react"
import Image from "next/image"
import { updateDentistProfile } from "@/app/actions/dashboard"
import { submitDegreeForVerification } from "@/app/actions/admin"
import { useRouter } from "next/navigation"

export function ProfileForm({ initialData }: { initialData: any }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [degreeUrl, setDegreeUrl] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        name: initialData?.user?.name || "",
        specialty: initialData?.specialty || "",
        location: initialData?.location || "",
        about: initialData?.about || "",
        education: initialData?.education || "",
        experienceYears: initialData?.experienceYears || 0,
        priceFrom: initialData?.priceFrom || 0,
        image: initialData?.user?.image || initialData?.image || ""
    })

    const handleVerificationSubmit = async () => {
        if (!degreeUrl) return
        setLoading(true)
        try {
            await submitDegreeForVerification(degreeUrl)
            router.refresh()
            alert("Degree submitted for verification!")
        } catch (error) {
            alert("Failed to submit degree.")
        } finally {
            setLoading(false)
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateDentistProfile(formData)
            router.refresh()
            alert("Profile updated successfully!")
        } catch (error) {
            console.error(error)
            alert("Failed to update profile.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">Public Profile</h1>
                    <p className="text-sm text-gray-500">Manage how your profile appears to patients.</p>
                </div>
                <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto">
                    {loading ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Photo */}
                <Card className="lg:col-span-1 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Profile Photo</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden mb-4 border-4 border-gray-50 shadow-inner bg-gray-100">
                            {formData.image ? (
                                <Image
                                    src={formData.image}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Upload className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-4 w-4" /> Change Photo
                        </Button>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            JPG, PNG or GIF. Max size 2MB.
                        </p>
                    </CardContent>
                </Card>

                {/* Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Specialty</Label>
                                    <Input
                                        id="specialty"
                                        value={formData.specialty}
                                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="location">Clinic Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="experience">Years of Experience</Label>
                                    <Input
                                        id="experience"
                                        type="number"
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Consultation Fee (€)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.priceFrom}
                                    onChange={(e) => setFormData({ ...formData, priceFrom: parseInt(e.target.value) })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Professional Bio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="about">About Me</Label>
                                <Textarea
                                    id="about"
                                    rows={5}
                                    value={formData.about}
                                    onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                                    placeholder="Tell patients about your experience and approach to care..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="education">Education & Certifications</Label>
                                <Textarea
                                    id="education"
                                    rows={3}
                                    value={formData.education}
                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                    placeholder="List your degrees and specialized training..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Verification Section */}
                    <Card className="border-none shadow-sm border-2 border-primary-100">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                Verification Status
                                {initialData?.isVerified ? (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-wider">Verified</span>
                                ) : initialData?.isPendingVerification ? (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold uppercase tracking-wider">Under Review</span>
                                ) : (
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-wider">Not Verified</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!initialData?.isVerified && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">
                                        To activate your profile and allow patients to book appointments, you must upload your professional degree or certification for review.
                                    </p>

                                    {!initialData?.isPendingVerification ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="degree">Upload Degree (Image URL)</Label>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Input
                                                    id="degree"
                                                    padding-right="2"
                                                    placeholder="Paste image URL of your degree"
                                                    value={degreeUrl}
                                                    onChange={(e) => setDegreeUrl(e.target.value)}
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleVerificationSubmit}
                                                    disabled={!degreeUrl || loading}
                                                    className="w-full sm:w-auto"
                                                >
                                                    Submit
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                                            Your degree is currently being reviewed by our team. You will be notified once verified.
                                        </div>
                                    )}
                                </div>
                            )}
                            {initialData?.isVerified && (
                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                                    <ShieldCheck className="h-5 w-5" />
                                    Your account is fully verified and visible to patients.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    )
}
