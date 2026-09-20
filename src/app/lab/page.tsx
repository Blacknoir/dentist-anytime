import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_LABS, MOCK_CASES, COMMISSION_RATE } from "@/lib/lab-mock";
import { LabCard, CaseCard } from "@/components/lab/lab-components";
import { Upload, Store, BadgeCheck, CreditCard, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";

export default function LabMarketplacePage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary-50/80 to-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="inline-flex items-center gap-2 bg-white border border-primary-100 rounded-full px-3 py-1 text-xs font-bold text-primary-700 shadow-sm mb-5">
            <FlaskConical className="h-3.5 w-3.5" /> DEMO · B2B Marketplace Οδοντιάτρων → Εργαστηρίων
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight max-w-3xl">
            Στείλε την εργασία σου στο εργαστήριο — <span className="text-primary-500">χωρίς τηλέφωνα και courier στο άγνωστο.</span>
          </h1>
          <p className="text-gray-500 mt-4 max-w-2xl">
            Ανεβάζεις STL + φωτογραφίες + οδηγίες, παίρνεις προσφορές από verified labs,
            διαλέγεις με βάση τιμή / χρόνο / αξιολόγηση, πληρώνεις μέσα στην πλατφόρμα.
            Η Dentora κρατάει {COMMISSION_RATE}% προμήθεια. Μπορείς να στείλεις και απευθείας στο <strong>Dentora Smile Lab</strong>.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button size="lg" asChild><Link href="/lab/new">+ Νέα εργαστηριακή εργασία <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/lab/cases">Δες ανοιχτές εργασίες ({MOCK_CASES.length})</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/lab/labs">Βρες εργαστήριο ({MOCK_LABS.length})</Link></Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 text-sm">
            {[
              { icon: Upload, t: "Upload STL + shade" },
              { icon: Store, t: "Προσφορές από labs" },
              { icon: ShieldCheck, t: "Verified labs μόνο" },
              { icon: CreditCard, t: `Πληρωμή + ${COMMISSION_RATE}% fee` },
            ].map((s) => (
              <div key={s.t} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5 shadow-sm">
                <s.icon className="h-4 w-4 text-primary-500 shrink-0" />
                <span className="font-medium text-gray-700">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Πώς δουλεύει (demo ροή)</h2>
          <p className="text-sm text-gray-500 mb-6">Ασθενής → Οδοντίατρος → Εργαστήριο. Εσύ βλέπεις και τις 3 πλευρές σε ένα μέρος.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-5">
              <div className="text-xs font-bold text-primary-600 mb-1">ΒΗΜΑ 1 · ΟΔΟΝΤΙΑΤΡΟΣ</div>
              <h3 className="font-bold">Δημιουργεί εργασία</h3>
              <p className="text-sm text-gray-500 mt-1">Είδος, υλικό, απόχρωση, deadline, STL/φωτογραφίες. Επιλέγει “Smile Lab” ή “Ανοιχτό marketplace”.</p>
              <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/lab/new">Δοκίμασε τη φόρμα</Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-xs font-bold text-primary-600 mb-1">ΒΗΜΑ 2 · ΕΡΓΑΣΤΗΡΙΑ</div>
              <h3 className="font-bold">Κάνουν προσφορά</h3>
              <p className="text-sm text-gray-500 mt-1">Βλέπουν ανοιχτές εργασίες, απαντούν με τιμή + χρόνο παράδοσης + μήνυμα.</p>
              <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/lab/cases">Δες το board εργασιών</Link></Button>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-xs font-bold text-primary-600 mb-1">ΒΗΜΑ 3 · ΑΝΑΘΕΣΗ + ΠΛΗΡΩΜΗ</div>
              <h3 className="font-bold">Επιλογή + {COMMISSION_RATE}%</h3>
              <p className="text-sm text-gray-500 mt-1">Ο οδοντίατρος συγκρίνει, αναθέτει, πληρώνει. Το lab παίρνει το ποσό μείον προμήθεια.</p>
              <Button size="sm" variant="outline" className="mt-3" asChild><Link href="/lab/cases/case-1">Δες σύγκριση προσφορών</Link></Button>
            </CardContent></Card>
          </div>
        </div>
      </section>

      {/* Open cases preview */}
      <section className="py-8 bg-gray-50/60 border-y border-gray-100">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ανοιχτές εργασίες τώρα</h2>
            <Button variant="ghost" size="sm" asChild><Link href="/lab/cases">Όλες →</Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_CASES.slice(0, 3).map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      {/* Labs preview */}
      <section className="py-12">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-green-600" /> Verified εργαστήρια
            </h2>
            <Button variant="ghost" size="sm" asChild><Link href="/lab/labs">Όλα →</Link></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_LABS.slice(0, 3).map((l) => <LabCard key={l.id} lab={l} />)}
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">
            Demo με ψεύτικα δεδομένα — δεν γίνονται χρεώσεις, uploads ή αποστολές. Το “Dentora Smile Lab” εμφανίζεται πάντα πρώτο ως δικό σου lab.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
