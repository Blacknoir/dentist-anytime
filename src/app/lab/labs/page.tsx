import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { MOCK_LABS } from "@/lib/lab-mock";
import { LabCard } from "@/components/lab/lab-components";

export default function LabsPage() {
  const sorted = [...MOCK_LABS].sort((a, b) => (b.isDentoraLab ? 1 : 0) - (a.isDentoraLab ? 1 : 0));
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-28 pb-16 container mx-auto px-4 md:px-6 max-w-6xl">
        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Demo · Κατάλογος</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Verified οδοντοτεχνικά εργαστήρια</h1>
        <p className="text-sm text-gray-500 mt-1">
          Σύγκρινε με βάση τιμή, χρόνο παράδοσης, αξιολόγηση, εξοπλισμό και υλικά. Το Dentora Smile Lab συμμετέχει ισότιμα — δεν είναι υποχρεωτικός προμηθευτής.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sorted.map((l) => <LabCard key={l.id} lab={l} actionLabel={l.isDentoraLab ? "Στείλε απευθείας" : "Δες + ζήτα προσφορά"} />)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link href="/lab/new">+ Νέα εργασία</Link></Button>
          <Button variant="outline" asChild><Link href="/lab/cases">Πίσω στο board</Link></Button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
