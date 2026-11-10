"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/shared/logo"
import { signInAdmin, type AdminLoginState } from "@/app/actions/admin-auth"

export default function AdminLoginPage() {
    const [state, formAction, pending] = useActionState<AdminLoginState | null, FormData>(
        signInAdmin,
        null
    )

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Logo className="mx-auto" />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">Admin Portal</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Σύνδεση διαχειριστή της πλατφόρμας. Μετά τη σύνδεση μεταφέρεσαι στη διαχείριση
                        του Dentora Lab.
                    </p>
                </div>

                <Card className="border-none shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Login to your account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            {state?.error && (
                                <p className="text-sm text-red-600 font-medium">{state.error}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={pending}>
                                {pending ? "Σύνδεση..." : "Sign In"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-gray-400">
                    Τα στοιχεία σύνδεσης ορίζονται μέσω ADMIN_USERNAME / ADMIN_PASSWORD στο environment.
                </p>
                <p className="text-center text-xs text-gray-400">
                    <Link href="/lab/login" className="hover:text-primary-600">
                        Χρειάζεσαι λογαριασμό Dentora Lab; Σύνδεση εδώ
                    </Link>
                </p>
            </div>
        </div>
    )
}
