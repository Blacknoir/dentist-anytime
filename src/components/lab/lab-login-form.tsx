"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, KeyRound, Stethoscope, Building2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithGoogleLab, signInWithLabAccount, type LabRole } from "@/app/actions/lab-auth"

const DEMO_ACCOUNTS = [
    { email: "dentist@demo.dentora.gr", label: "Οδοντίατρος", icon: Stethoscope },
    { email: "designer@demo.dentora.gr", label: "CAD Designer", icon: UserRound },
    { email: "lab@demo.dentora.gr", label: "Εργαστήριο", icon: Building2 },
]

const GOOGLE_ROLES: { role: LabRole; label: string }[] = [
    { role: "DENTIST", label: "Οδοντίατρος" },
    { role: "LAB", label: "Εργαστήριο" },
    { role: "DESIGNER", label: "CAD Designer" },
]

export function LabLoginForm({ devMode }: { devMode: boolean }) {
    const { status } = useSession()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [pending, setPending] = useState<string | null>(null)

    const handleAccount = async (accountEmail: string, accountPassword: string) => {
        setPending(accountEmail)
        await signInWithLabAccount(accountEmail, accountPassword)
    }

    const handleGoogle = async (role: LabRole) => {
        setPending(role)
        await signInWithGoogleLab(role)
    }

    return (
        <div className="mt-10 space-y-6">
            {status === "authenticated" && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex flex-wrap items-center justify-between gap-3">
                    <span>Είσαι ήδη συνδεδεμένος.</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/lab/cases">Οι εργασίες μου</Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/lab/new">Νέα εργασία</Link>
                        </Button>
                    </div>
                </div>
            )}

            {devMode && (
                <Card className="border-dashed border-primary-300">
                    <CardContent className="p-6 space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Γρήγορη σύνδεση (dev)</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Λειτουργεί μόνο σε development, χωρίς OAuth redirect. Χρειάζεται ο λογαριασμός να
                                υπάρχει ήδη στη βάση (δημιουργείται με <code>npm run seed:lab</code>).
                            </p>
                        </div>

                        <form
                            className="grid gap-4 sm:grid-cols-2"
                            onSubmit={(event) => {
                                event.preventDefault()
                                handleAccount(email, password)
                            }}
                        >
                            <div className="space-y-1.5">
                                <Label htmlFor="lab-email">Email</Label>
                                <Input
                                    id="lab-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="dentist@demo.dentora.gr"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lab-password">Κωδικός</Label>
                                <Input
                                    id="lab-password"
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="dentora-dev"
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Button type="submit" disabled={pending !== null}>
                                    <KeyRound className="h-4 w-4 mr-2" />
                                    {pending ? "Σύνδεση..." : "Σύνδεση"}
                                </Button>
                            </div>
                        </form>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {DEMO_ACCOUNTS.map((account) => {
                                const Icon = account.icon
                                return (
                                    <Button
                                        key={account.email}
                                        variant="outline"
                                        className="justify-start"
                                        disabled={pending !== null}
                                        onClick={() => handleAccount(account.email, "dentora-dev")}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        <span className="text-left">
                                            <span className="block text-sm font-medium">{account.label}</span>
                                            <span className="block text-xs text-gray-500">{account.email}</span>
                                        </span>
                                    </Button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Σύνδεση με Google</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Ο ρόλος επιλέγεται μετά τη σύνδεση και αποθηκεύεται στο προφίλ σου.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {GOOGLE_ROLES.map((item) => (
                            <Button
                                key={item.role}
                                variant="outline"
                                disabled={pending !== null}
                                onClick={() => handleGoogle(item.role)}
                            >
                                {item.label}
                                {pending !== item.role && <ArrowRight className="h-4 w-4 ml-2" />}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
