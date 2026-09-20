"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MOCK_CASES, labById, commissionOf, labPayout, COMMISSION_RATE, type LabOffer } from "@/lib/lab-mock";
import { StatusBadge, LabStars } from "@/components/lab/lab-components";
import { FileUp, Camera, Check, CreditCard, Truck, FlaskConical, History } from "lucide-react";
import { cn } from "@/lib/utils";

function fileIcon(kind: string) {
  if (kind === "STL") return <FileUp className="h-4 w-4 text-primary-600" />;
  if (kind === "PHOTO") return <Camera className="h-4 w-4 text-green-600" />;
  return <FileUp className="h-4 w-4 text-gray-500" />;
}

export default function LabCaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const base = useMemo(() => {
    const fromMock = MOCK_CASES.find((c) => c.id === id);
    if (fromMock) return fromMock;
    try {
      const mine = JSON.parse(localStorage.getItem("dentora-lab-cases") || "[]");
      return mine.find((c: { id: string }) => c.id === id);
    } catch { return undefined; }
  }, [id]);

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(base?.assignedLabId ? base.offers.find((o: LabOffer) => o.labId === base.assignedLabId)?.id ?? null : null);
  const [paid, setPaid] = useState(false);
  const [labBid, setLabBid] = useState({ price: "", days: "", message: "" });
  const [extraOffers, setExtraOffers] = useState<LabOffer[]>([]);

  if (!base) {
    return (
      <main className="min-h-screen bg-white"><Header />
        <div className="pt-32 text-center">Δεν βρέθηκε η εργασία. <Link href="/lab/cases" className="text-primary-600 underline">Πίσω</Link></div>
      </main>
    );
  }

  const allOffers = [...extraOffers, ...base.offers];
  const sorted = [...allOffers].sort((a, b) => a.price - b.price);
  const selected = sorted.find((o) => o.id === selectedOfferId);
  const selectedLab = selected ? labById(selected.labId) : undefined;

  const submitBid = () => {
    if (!labBid.price) return;
    setExtraOffers((prev) => [{
      id: `demo-${Date.now()}`,
      labId: "lab-5",
      price: Number(labBid.price),
      leadTimeDays: Number(labBid.days) || 4,
      message: labBid.message || "Demo προσφορά από Express Mill Center.",
      createdAt: new Date().toISOString().slice(0, 10),
      prevCollaborations: 0,
    }, ...prev]);
    setLabBid({ price: "", days: "", message: "" });
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-28 pb-16 container mx-auto px-4 md:px-6 max-w-6xl">
        <Link href="/lab/cases" className="text-sm text-gray-500 hover:text-gray-900">← Πίσω στο board</Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{base.code} · {base.type}</h1>
          <StatusBadge status={selectedOfferId ? "ASSIGNED" : base.status} />
          {base.priority === "Express" && <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-1">EXPRESS</span>}
        </div>
        <p className="text-sm text-gray-500 mt-1">{base.dentistName} · Δημιουργήθηκε {base.createdAt} · Παράδοση {base.deadline}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: case */}
          <div className="lg:col-span-2 space-y-6">
            <Card><CardHeader><CardTitle className="text-base">Στοιχεία περιστατικού</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[["Είδος", base.type], ["Υλικό", base.material], ["Απόχρωση", base.shade], ["Τεμάχια", String(base.units)]].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl p-3"><div className="text-[11px] uppercase font-bold text-gray-400">{k}</div><div className="font-bold text-gray-900">{v}</div></div>
                  ))}
                </div>
                <p className="text-gray-600">{base.description}</p>
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-gray-400">Αρχεία (STL / φωτογραφίες)</div>
                  {base.files.map((f: { name: string; size: string; kind: string }) => (
                    <div key={f.name} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                      <span className="flex items-center gap-2 font-medium text-gray-700">{fileIcon(f.kind)} {f.name}</span>
                      <span className="text-xs text-gray-400">{f.kind} · {f.size}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Προσφορές εργαστηρίων ({sorted.length}) — σύγκριση</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {sorted.length === 0 && <p className="text-sm text-gray-500">Καμία προσφορά ακόμα. Στο demo μπορείς να προσθέσεις μία από το κουτί δεξιά (“ως εργαστήριο”).</p>}
                {sorted.map((o) => {
                  const lab = labById(o.labId);
                  const active = o.id === selectedOfferId;
                  return (
                    <div key={o.id} className={cn("border rounded-2xl p-4 transition-colors", active ? "border-primary-400 ring-1 ring-primary-200 bg-primary-50/40" : "border-gray-200 bg-white")}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-gray-900">{lab?.name}</strong>
                            {lab?.isDentoraLab && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5"><FlaskConical className="h-3 w-3" /> Smile Lab</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            {lab && <LabStars rating={lab.rating} count={lab.reviewCount} />}
                            <span>⏱ {o.leadTimeDays} ημ.</span>
                            {(o.prevCollaborations ?? 0) > 0 && <span className="text-xs">· {o.prevCollaborations} προηγ. συνεργασίες</span>}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">“{o.message}”</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">€{o.price}</div>
                          <Button size="sm" variant={active ? "default" : "outline"} className="mt-2" onClick={() => setSelectedOfferId(o.id)}>
                            {active ? <><Check className="h-4 w-4 mr-1" /> Επιλεγμένο</> : "Επιλογή"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Ιστορικό / Tracking (demo)</CardTitle></CardHeader>
              <CardContent>
                <ol className="relative border-l border-gray-200 ml-2 space-y-4 text-sm">
                  {[["Δημιουργία εργασίας", base.createdAt, true], ["Λήψη προσφορών", "αυτόματα", true], ["Ανάθεση σε εργαστήριο", selected ? "μόλις επέλεξες ✓" : "εκκρεμεί", !!selected], ["Παραγωγή → Αποστολή → Παράδοση", "μετά την πληρωμή", paid]].map(([t, d, done]) => (
                    <li key={t as string} className="ml-4">
                      <span className={cn("absolute -left-[7px] mt-1 h-3 w-3 rounded-full border-2", done ? "bg-green-500 border-green-500" : "bg-white border-gray-300")} />
                      <div className="font-bold text-gray-900">{t}</div><div className="text-gray-500 text-xs">{d as string}</div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Right: payment + lab bid */}
          <div className="space-y-6">
            <Card className="border-primary-100">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Πληρωμή μέσω Dentora</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!selected ? (
                  <p className="text-gray-500">Διάλεξε μία προσφορά για να δεις την ανάλυση πληρωμής (τιμή / προμήθεια {COMMISSION_RATE}% / payout lab).</p>
                ) : (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Εργασία ({selectedLab?.name})</span><strong>€{selected.price}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Προμήθεια Dentora ({COMMISSION_RATE}%)</span><strong>€{commissionOf(selected.price)}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Πληρωτέο στο lab</span><strong>€{labPayout(selected.price)}</strong></div>
                    <div className="flex justify-between border-t border-dashed border-gray-200 pt-2"><span className="font-bold">Χρεώνεσαι</span><span className="font-bold text-lg">€{selected.price}</span></div>
                    {!paid ? (
                      <Button className="w-full" onClick={() => setPaid(true)}>Πλήρωσε €{selected.price} (demo — χωρίς χρέωση)</Button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-800">
                        <div className="font-bold flex items-center gap-1"><Check className="h-4 w-4" /> Πληρωμή επιτυχής (demo)</div>
                        <div className="text-xs mt-1 flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Το lab ενημερώθηκε και ξεκινά παραγωγή.</div>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-400">Στο πραγματικό προϊόν εδώ μπαίνει Stripe Checkout με escrow: κράτηση τώρα, capture στην παράδοση, αυτόματο transfer στο lab.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Κάνε προσφορά (ως εργαστήριο)</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Τιμή €" inputMode="numeric" value={labBid.price} onChange={(e) => setLabBid({ ...labBid, price: e.target.value })} />
                  <Input placeholder="Ημέρες" inputMode="numeric" value={labBid.days} onChange={(e) => setLabBid({ ...labBid, days: e.target.value })} />
                </div>
                <Input placeholder="Μήνυμα προς οδοντίατρο..." value={labBid.message} onChange={(e) => setLabBid({ ...labBid, message: e.target.value })} />
                <Button variant="outline" className="w-full" onClick={submitBid}>Υποβολή προσφοράς (demo)</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
