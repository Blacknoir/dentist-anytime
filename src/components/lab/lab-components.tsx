"use client";

import Link from "next/link";
import { Star, MapPin, BadgeCheck, FlaskConical, Timer, Euro } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Lab, LabCase } from "@/lib/lab-mock";
import { STATUS_META, labById } from "@/lib/lab-mock";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: LabCase["status"] }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", meta.classes)}>
      {meta.label}
    </span>
  );
}

export function LabStars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <strong>{rating.toFixed(1)}</strong>
      {count !== undefined && <span className="text-gray-400">({count})</span>}
    </span>
  );
}

export function LabCard({ lab, actionLabel = "Προφίλ" }: { lab: Lab; actionLabel?: string }) {
  return (
    <Card className={lab.isDentoraLab ? "border-primary-200 ring-1 ring-primary-100" : ""}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900">{lab.name}</h3>
              {lab.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              {lab.isDentoraLab && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5">
                  <FlaskConical className="h-3 w-3" /> Dentora Smile Lab
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" /> {lab.city} · {lab.completedCases.toLocaleString("el")} εργασίες
            </p>
          </div>
          <LabStars rating={lab.rating} count={lab.reviewCount} />
        </div>
        <p className="text-sm text-gray-600">{lab.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {lab.equipment.slice(0, 4).map((e) => (
            <span key={e} className="text-[11px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{e}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1 text-sm">
          <span className="flex items-center gap-1 text-gray-600"><Timer className="h-4 w-4" /> ~{lab.avgLeadTimeDays} ημέρες</span>
          <span className="flex items-center gap-1 font-bold text-gray-900"><Euro className="h-4 w-4" /> από {lab.priceFrom}</span>
        </div>
        <Button variant={lab.isDentoraLab ? "default" : "outline"} size="sm" className="w-full" asChild>
          <Link href={`/lab/labs?highlight=${lab.id}`}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CaseCard({ c }: { c: LabCase }) {
  const assigned = c.assignedLabId ? labById(c.assignedLabId) : undefined;
  return (
    <Link href={`/lab/cases/${c.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-gray-500">{c.code}</span>
            <StatusBadge status={c.status} />
          </div>
          <h3 className="font-bold text-gray-900">{c.type} · {c.material}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{c.description}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="bg-gray-100 rounded-full px-2 py-0.5">Απόχρωση {c.shade}</span>
            <span className="bg-gray-100 rounded-full px-2 py-0.5">{c.units} τεμ.</span>
            <span className="bg-gray-100 rounded-full px-2 py-0.5">Παράδοση {c.deadline}</span>
            {c.priority === "Express" && <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-bold">EXPRESS</span>}
          </div>
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-gray-500">{c.files.length} αρχεία · {c.offers.length} προσφορές</span>
            {assigned ? (
              <span className="text-xs font-bold text-violet-700">→ {assigned.name}</span>
            ) : (
              <span className="text-xs font-bold text-primary-600">Δες προσφορές →</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
