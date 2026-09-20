"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_CASES } from "@/lib/lab-mock";
import { CaseCard } from "@/components/lab/lab-components";
import { cn } from "@/lib/utils";

const FILTERS = ["Όλες", "Ανοιχτές", "Με προσφορές", "Express", "Smile Lab"] as const;

export default function LabCasesPage() {
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("Όλες");
  const [role, setRole] = useState<"dentist" | "lab">("dentist");

  const cases = useMemo(() => {
    let list = [...MOCK_CASES];
    // + όσες δημιούργησε ο χρήστης στο demo (localStorage)
    try {
      const mine = JSON.parse(localStorage.getItem("dentora-lab-cases") || "[]");
      list = [...mine, ...list];
    } catch { /* ignore */ }
    if (f === "Ανοιχτές") list = list.filter((c) => c.status === "OPEN");
    if (f === "Με προσφορές") list = list.filter((c) => c.offers.length > 0);
    if (f === "Express") list = list.filter((c) => c.priority === "Express");
    if (f === "Smile Lab") list = list.filter((c) => c.assignedLabId === "smile-lab" || c.offers.some((o) => o.labId === "smile-lab"));
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((c) => `${c.code} ${c.type} ${c.material} ${c.description}`.toLowerCase().includes(s));
    }
    return list;
  }, [q, f]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-28 pb-16 container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Demo · {role === "dentist" ? "Μάτι οδοντιάτρου" : "Μάτι εργαστηρίου"}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Board εργασιών</h1>
            <p className="text-sm text-gray-500 mt-1">
              {role === "dentist"
                ? "Παρακολούθησε τις εργασίες σου και σύγκρινε προσφορές."
                : "Δες διαθέσιμες εργασίες και κάνε προσφορά ανάλογα με τις δυνατότητές σου."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-full p-1 text-sm font-medium">
              {(["dentist", "lab"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn("px-4 py-1.5 rounded-full transition-colors", role === r ? "bg-white shadow text-gray-900" : "text-gray-500")}
                >
                  {r === "dentist" ? "Οδοντίατρος" : "Εργαστήριο"}
                </button>
              ))}
            </div>
            <Button asChild><Link href="/lab/new">+ Νέα εργασία</Link></Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
          <Input placeholder="Αναζήτηση: στεφάνη, zirconia, LAB-..." value={q} onChange={(e) => setQ(e.target.value)} className="md:max-w-sm" />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((x) => (
              <button
                key={x}
                onClick={() => setF(x)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-full border transition-colors",
                  f === x ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                )}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        {cases.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="font-bold text-gray-900">Καμία εργασία με αυτά τα φίλτρα</p>
            <p className="text-sm text-gray-500 mt-1">Δοκίμασε άλλη αναζήτηση ή δημιούργησε νέα εργασία.</p>
            <Button className="mt-4" asChild><Link href="/lab/new">+ Νέα εργασία</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c) => <CaseCard key={c.id} c={c} />)}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-8">
          Σημείωση demo: οι εργασίες που φτιάχνεις από τη φόρμα αποθηκεύονται τοπικά (localStorage) και εμφανίζονται εδώ με πράσινο σήμα “Δική σου”.
        </p>
      </div>
      <Footer />
    </main>
  );
}
