"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WORK_TYPES, MATERIALS, SHADES, commissionOf, type LabCase } from "@/lib/lab-mock";
import { cn } from "@/lib/utils";
import { FlaskConical, Store, FileUp, Check } from "lucide-react";

const STEPS = ["Εργασία", "Αρχεία", "Αποστολή"] as const;

export default function NewLabCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: "Στεφάνη",
    material: "Zirconia monolithic",
    shade: "A2",
    units: 1,
    deadline: "2026-09-26",
    priority: "Standard" as "Standard" | "Express",
    description: "",
    target: "marketplace" as "smile" | "marketplace",
  });
  const [files, setFiles] = useState<string[]>(["upper-arch.stl (84 MB)", "lower-arch.stl (71 MB)"]);
  const [done, setDone] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const id = `demo-${Date.now()}`;
    const code = `LAB-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const item: LabCase = {
      id, code,
      type: form.type as LabCase["type"],
      material: form.material,
      shade: form.shade,
      units: Number(form.units) || 1,
      deadline: form.deadline,
      priority: form.priority,
      status: "OPEN",
      description: form.description || "—",
      files: files.map((n) => ({ name: n, size: "demo", kind: n.endsWith(".stl") ? "STL" : "PHOTO" as const })),
      offers: form.target === "smile"
        ? [{ id: `o-${id}`, labId: "smile-lab", price: 85, leadTimeDays: 4, message: "Αυτόματη αποδοχή από Dentora Smile Lab (demo τιμοκατάλογος).", createdAt: "2026-09-16", prevCollaborations: 0 }]
        : [],
      dentistName: "Εσύ (demo οδοντίατρος)",
      createdAt: "2026-09-16",
    };
    try {
      const prev = JSON.parse(localStorage.getItem("dentora-lab-cases") || "[]");
      localStorage.setItem("dentora-lab-cases", JSON.stringify([item, ...prev]));
    } catch { /* ignore */ }
    setDone(id);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-28 pb-16 container mx-auto px-4 md:px-6 max-w-3xl">
        <Link href="/lab" className="text-sm text-gray-500 hover:text-gray-900">← Marketplace</Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">Νέα εργαστηριακή εργασία</h1>
        <p className="text-sm text-gray-500">Demo φόρμα — 3 βήματα. Δεν ανεβαίνει τίποτα πραγματικά.</p>

        <div className="flex gap-2 mt-6">
          {STEPS.map((s, i) => (
            <div key={s} className={cn("flex-1 rounded-full px-3 py-1.5 text-center text-sm font-bold border", i <= step ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-400 border-gray-200")}>
              {i + 1}. {s}
            </div>
          ))}
        </div>

        {!done ? (
          <Card className="mt-6"><CardContent className="p-6 space-y-4">
            {step === 0 && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400">Είδος εργασίας</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {WORK_TYPES.map((t) => (
                      <button key={t} onClick={() => set("type", t)} className={cn("px-3 py-1.5 rounded-full border text-sm", form.type === t ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600")}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400">Υλικό</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {MATERIALS.map((m) => (
                        <button key={m} onClick={() => set("material", m)} className={cn("px-3 py-1.5 rounded-full border text-sm", form.material === m ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600")}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400">Απόχρωση</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SHADES.map((s) => (
                        <button key={s} onClick={() => set("shade", s)} className={cn("px-3 py-1.5 rounded-full border text-sm", form.shade === s ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600")}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-bold uppercase text-gray-400">Τεμάχια</label><Input type="number" min={1} value={form.units} onChange={(e) => set("units", Number(e.target.value))} className="mt-2" /></div>
                  <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-400">Ημερομηνία παράδοσης</label><Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} className="mt-2" /></div>
                </div>
                <div className="flex gap-2">
                  {(["Standard", "Express"] as const).map((p) => (
                    <button key={p} onClick={() => setForm((f) => ({ ...f, priority: p }))} className={cn("flex-1 border rounded-xl py-2 text-sm font-bold", form.priority === p ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-500")}>
                      {p === "Express" ? "⚡ Express (+γρήγορα)" : "Standard"}
                    </button>
                  ))}
                </div>
                <div><label className="text-xs font-bold uppercase text-gray-400">Οδηγίες / σημειώσεις</label>
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="π.χ. chamfer, glaze, αντίπαλο άθικτο, βιδωτή 35Ncm..." className="mt-2 w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-gray-400" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <FileUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="font-bold text-gray-900">Σύρε STL / φωτογραφίες εδώ (demo)</p>
                  <p className="text-xs text-gray-400 mt-1">Στο πραγματικό προϊόν: presigned upload σε R2/S3 με progress + preview 3D.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["scan-upper.stl", "shade-photo.jpg", "rx.jpg"].map((n) => (
                      <Button key={n} size="sm" variant="outline" onClick={() => setFiles((f) => [...f, `${n} (demo)`])}>+ {n}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {files.map((f) => (
                    <div key={f} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{f}</span>
                      <button className="text-red-500 text-xs font-bold" onClick={() => setFiles((x) => x.filter((y) => y !== f))}>Αφαίρεση</button>
                    </div>
                  ))}
                  {files.length === 0 && <p className="text-sm text-amber-600">Πρόσθεσε τουλάχιστον 1 αρχείο για το demo.</p>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button onClick={() => setForm((f) => ({ ...f, target: "smile" }))} className={cn("border-2 rounded-2xl p-4 text-left transition-colors", form.target === "smile" ? "border-primary-500 bg-primary-50/50" : "border-gray-200")}>
                    <div className="flex items-center gap-2 font-bold text-gray-900"><FlaskConical className="h-5 w-5 text-primary-500" /> Στείλε στο Dentora Smile Lab</div>
                    <p className="text-sm text-gray-500 mt-1">Απευθείας ανάθεση, εγγυημένος χρόνος 4 ημ., demo τιμή €85. Χωρίς αναμονή προσφορών.</p>
                  </button>
                  <button onClick={() => setForm((f) => ({ ...f, target: "marketplace" }))} className={cn("border-2 rounded-2xl p-4 text-left transition-colors", form.target === "marketplace" ? "border-gray-900 bg-gray-50" : "border-gray-200")}>
                    <div className="flex items-center gap-2 font-bold text-gray-900"><Store className="h-5 w-5" /> Ανοιχτό marketplace</div>
                    <p className="text-sm text-gray-500 mt-1">Λαμβάνεις προσφορές από όλα τα verified labs και διαλέγεις τιμή / χρόνο / rating.</p>
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm space-y-1">
                  <div className="font-bold text-gray-900 mb-2">Σύνοψη</div>
                  <div className="flex justify-between"><span className="text-gray-500">Εργασία</span><span>{form.type} · {form.material} · {form.shade}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Αρχεία</span><span>{files.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Παράδοση</span><span>{form.deadline} {form.priority === "Express" ? "⚡" : ""}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ενδεικτική προμήθεια 10%</span><span>π.χ. στα €100 → €{commissionOf(100)} fee</span></div>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Πίσω</Button>
              {step < 2
                ? <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && files.length === 0}>Συνέχεια</Button>
                : <Button onClick={submit}>Δημιουργία εργασίας (demo)</Button>}
            </div>
          </CardContent></Card>
        ) : (
          <Card className="mt-6"><CardHeader><CardTitle className="flex items-center gap-2 text-green-700"><Check className="h-5 w-5" /> Η εργασία δημιουργήθηκε (demo)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Αποθηκεύτηκε τοπικά στο browser σου και εμφανίζεται στο board. Στο πραγματικό προϊόν θα αποθηκευτεί στη βάση + θα ειδοποιηθούν τα labs.</p>
              <div className="flex gap-2">
                <Button asChild><Link href={`/lab/cases/${done}`}>Δες την εργασία</Link></Button>
                <Button variant="outline" asChild><Link href="/lab/cases">Πίσω στο board</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </main>
  );
}
