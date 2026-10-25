import Link from "next/link"
import { ArrowRight, BadgeCheck, CreditCard, FileUp, MessagesSquare, PackageCheck, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { CaseCard, DesignerCard } from "@/components/lab/lab-components"
import { LAB_PLATFORM_FEE_RATE, euros } from "@/lib/lab"

export const dynamic = "force-dynamic"

export default async function LabHomePage() {
    const [openCases, designerCount, completedCases, openCaseList, designers] = await Promise.all([
        prisma.labCase.count({ where: { status: { in: ["OPEN", "QUOTED"] } } }),
        prisma.designerProfile.count(),
        prisma.labCase.count({ where: { status: "COMPLETED" } }),
        prisma.labCase.findMany({
            where: { status: { in: ["OPEN", "QUOTED"] } },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            take: 3,
            include: {
                customer: { select: { name: true, role: true } },
                assignedDesigner: { select: { id: true, user: { select: { name: true } } } },
                _count: { select: { files: true, offers: true, revisions: true } },
            },
        }),
        prisma.designerProfile.findMany({
            orderBy: [{ completedCases: "desc" }, { createdAt: "desc" }],
            take: 3,
            include: {
                user: { select: { id: true, name: true, image: true } },
                services: { where: { isActive: true } },
            },
        }),
    ])

    return (
        <div className="pb-20">
            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white pt-16 pb-12">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-3 py-1">
                            <Sparkles className="h-3.5 w-3.5" /> Dentora Lab · CAD marketplace
                        </span>
                        <h1 className="mt-4 text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                            Στείλε τη σάρωση, πάρε το σχέδιο
                        </h1>
                        <p className="mt-4 text-gray-600 text-lg">
                            Οδοντίατρες και οδοντοτεχνικά εργαστήρια αναθέτουν εργασίες CAD σε εξειδικευμένους
                            designers, με προσφορές, χρόνο παράδοσης και ασφαλή πληρωμή — όλα σε ένα σημείο.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Button size="lg" asChild>
                                <Link href="/lab/new">
                                    Δημιούργησε εργασία
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/lab/designers">Δες CAD designers</Link>
                            </Button>
                            <Button size="lg" variant="ghost" asChild>
                                <Link href="/lab/register">Γίνε CAD designer</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Ανοιχτές εργασίες", value: String(openCases) },
                            { label: "CAD designers", value: String(designerCount) },
                            { label: "Ολοκληρωμένες εργασίες", value: String(completedCases) },
                            { label: "Προμήθεια πλατφόρμας", value: `${LAB_PLATFORM_FEE_RATE}%` },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="container mx-auto px-4 md:px-6 py-14">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Πώς λειτουργεί</h2>
                <p className="text-gray-600 mt-2 max-w-2xl">
                    Από τη σάρωση STL μέχρι την πληρωμή του designer, χωρίς ενδιάμεσους.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        {
                            icon: FileUp,
                            title: "1. Ανεβάζεις την εργασία",
                            text: "STL, φωτογραφίες, ακτινογραφίες και οδηγίες σχεδιασμού. Ορίζεις υλικό, απόχρωση, τεμάχια και deadline.",
                        },
                        {
                            icon: MessagesSquare,
                            title: "2. Λαμβάνεις προσφορές",
                            text: "Οι designers που βλέπουν την εργασία σου στέλνουν τιμή και χρόνο παράδοσης. Επιλέγεις ποιον θέλεις.",
                        },
                        {
                            icon: CreditCard,
                            title: "3. Πληρώνεις με ασφάλεια",
                            text: `Τα χρήματα κρατούνται σε escrow από τη Dentora (προμήθεια ${LAB_PLATFORM_FEE_RATE}%) και αποδεσμεύονται στον designer μετά την έγκρισή σου.`,
                        },
                        {
                            icon: PackageCheck,
                            title: "4. Εγκρίνεις & πληρώνεται",
                            text: "Ο designer ανεβάζει τα ολοκληρωμένα αρχεία. Ζητάς διορθώσεις αν χρειάζεται και επιβεβαιώνεις την παράδοση.",
                        },
                    ].map((step) => {
                        const Icon = step.icon
                        return (
                            <Card key={step.title} className="h-full">
                                <CardContent className="p-6 space-y-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                                    <p className="text-sm text-gray-600">{step.text}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </section>

            {/* Open cases */}
            <section className="container mx-auto px-4 md:px-6 pb-14">
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Ανοιχτές εργασίες</h2>
                        <p className="text-gray-600 text-sm mt-1">Διάλεξε designer για την επόμενη σου εργασία.</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/lab/cases">Όλες οι εργασίες</Link>
                    </Button>
                </div>

                {openCaseList.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center space-y-3">
                            <p className="text-gray-600">Δεν υπάρχουν ακόμα ανοιχτές εργασίες.</p>
                            <Button asChild>
                                <Link href="/lab/new">Δημιούργησε την πρώτη εργασία</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {openCaseList.map((c) => (
                            <CaseCard key={c.id} c={c} />
                        ))}
                    </div>
                )}
            </section>

            {/* Designers */}
            <section className="container mx-auto px-4 md:px-6 pb-16">
                <div className="flex items-end justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">CAD designers</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Δες υπηρεσίες, τιμές και χρόνους παράδοσης πριν δημιουργήσεις εργασία.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/lab/designers">Όλοι οι designers</Link>
                    </Button>
                </div>

                {designers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center space-y-3">
                            <p className="text-gray-600">
                                Δεν έχει εγγραφεί ακόμα CAD designer. Γίνε ο πρώτος!
                            </p>
                            <Button asChild>
                                <Link href="/lab/register">Εγγραφή designer</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {designers.map((designer) => (
                            <DesignerCard key={designer.id} designer={designer} />
                        ))}
                    </div>
                )}
            </section>

            {/* Trust */}
            <section className="bg-gray-50 border-t border-gray-200 py-14">
                <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Τα χρήματα προστατεύονται",
                            text: "Η πληρωμή κρατιέται στην Dentora μέχρι να εγκρίνεις τα αρχεία. Ο designer πληρώνεται μετά.",
                        },
                        {
                            icon: BadgeCheck,
                            title: "Επαληθευμένα προφίλ",
                            text: "Κάθε designer έχει δημόσιο προφίλ με υπηρεσίες, τιμές, χρόνους παράδοσης και ιστορικό.",
                        },
                        {
                            icon: Users,
                            title: "Οδοντίατρες & εργαστήρια",
                            text: "Δύο τύποι πελατών, ίδιο workflow: δημιουργία εργασίας, προσφορές, ανάθεση, παράδοση.",
                        },
                    ].map((item) => {
                        const Icon = item.icon
                        return (
                            <div key={item.title} className="flex gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-gray-200 text-primary-600 flex items-center justify-center">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{item.text}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className="container mx-auto px-4 md:px-6 py-12">
                <div className="rounded-3xl bg-primary-600 text-white p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold">Έτοιμος για την πρώτη σου εργασία CAD;</h2>
                        <p className="text-primary-50 mt-2 max-w-xl">
                            Ανέβασε τη σάρωση, διάλεξε designer και πλήρωσε μόνο όταν εγκρίνεις το αποτέλεσμα.
                            Χωρίς κρυφές χρεώσεις — προμήθεια πλατφόρμας {LAB_PLATFORM_FEE_RATE}%.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/lab/new">Νέα εργασία</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10" asChild>
                            <Link href="/lab/register">Εγγραφή</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
