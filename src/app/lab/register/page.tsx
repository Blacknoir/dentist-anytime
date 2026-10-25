"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, Building2, Stethoscope, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { signInWithGoogleLab, type LabRole } from "@/app/actions/lab-auth"

const ROLES: {
    role: LabRole
    icon: typeof Stethoscope
    title: string
    text: string
    bullets: string[]
}[] = [
    {
        role: "DENTIST",
        icon: Stethoscope,
        title: "Οδοντίατρος",
        text: "Δημιουργείς εργασίες CAD, λαμβάνεις προσφορές και εγκρίνεις το σχέδιο.",
        bullets: ["Ανεβάζεις STL & οδηγίες", "Διαλέγεις designer", "Πληρώνεις με ασφάλεια"],
    },
    {
        role: "LAB",
        icon: Building2,
        title: "Οδοντοτεχνικό εργαστήριο",
        text: "Δημιουργείς εργασίες για τις εργαστηριακές σου κατασκευές και συνεργάζεσαι με designers.",
        bullets: ["Δικό σου προφίλ εργαστηρίου", "Εργασίες για εσένα", "Πληρωμή ανά εργασία"],
    },
    {
        role: "DESIGNER",
        icon: UserRound,
        title: "CAD Designer",
        text: "Δημιουργείς δημόσιο προφίλ με υπηρεσίες και τιμές, κάνεις προσφορές και παραδίδεις αρχεία.",
        bullets: ["Δικό σου προφίλ & υπηρεσίες", "Προσφορές σε εργασίες", "Πληρωμή μέσω Stripe"],
    },
]

export default function LabRegisterPage() {
    const { data: session, status } = useSession()
    const [pending, setPending] = useState<LabRole | null>(null)

    const handleSignIn = async (role: LabRole) => {
        setPending(role)
        await signInWithGoogleLab(role)
    }

    return (
        <div className="pt-16 pb-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                <div className="text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Εγγραφή στο Dentora Lab</h1>
                    <p className="text-gray-600 mt-3">
                        Διάλεξε πώς θέλεις να χρησιμοποιείς την πλατφόρμα. Μπορείς να αλλάξεις ρόλο αργότερα —
                        ο λογαριασμός σου μένει ο ίδιος.
                    </p>
                </div>

                {status === "authenticated" && (
                    <div className="mt-6 mx-auto max-w-2xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 flex flex-wrap items-center justify-between gap-3">
                        <span>
                            Είσαι ήδη συνδεδεμένος ως{" "}
                            <strong>{(session.user as any)?.role}</strong>.
                        </span>
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

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ROLES.map((item) => {
                        const Icon = item.icon
                        return (
                            <Card key={item.role} className="h-full flex flex-col">
                                <CardContent className="p-6 flex flex-col gap-4 h-full">
                                    <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center">
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                                        <p className="text-sm text-gray-600 mt-1">{item.text}</p>
                                    </div>
                                    <ul className="space-y-1.5 text-sm text-gray-600 mt-1">
                                        {item.bullets.map((bullet) => (
                                            <li key={bullet} className="flex items-start gap-2">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className="w-full mt-auto"
                                        disabled={pending !== null}
                                        onClick={() => handleSignIn(item.role)}
                                    >
                                        {pending === item.role ? "Αναμονή..." : "Συνέχεια με Google"}
                                        {pending !== item.role && <ArrowRight className="h-4 w-4 ml-2" />}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <p className="text-center text-xs text-gray-400 mt-10">
                    Με την εγγραφή αποδέχεσαι τους όρους χρήσης και την πολιτική απορρήτου της πλατφόρμας.
                </p>
            </div>
        </div>
    )
}
