"use client";

import { ArrowUpRight, Clock3, FileAudio, FileImage, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { EvidenceKind, InvestigationHistoryRecord } from "@/features/investigation/types";

const evidenceIcons: Record<EvidenceKind, typeof FileText> = { text: FileText, email: FileText, image: FileImage, voice: FileAudio };

export function InvestigationHistory({ records, onOpen }: { records: InvestigationHistoryRecord[]; onOpen: (record: InvestigationHistoryRecord) => void }) {
  return <section aria-labelledby="investigation-history-title" className="mt-5"><Card className="glass border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">MY INVESTIGATIONS</p><h2 id="investigation-history-title" className="mt-2 text-xl font-medium text-white">Your returned case history</h2><p className="mt-2 text-xs leading-5 text-slate-500">This browser-session list stores returned case metadata, never the raw artifact or voice recording.</p></div><span className="rounded-xl border border-white/[.1] px-3 py-2 font-mono text-[10px] tracking-[.1em] text-slate-400">{records.length} CASE{records.length === 1 ? "" : "S"}</span></div>{records.length ? <div className="mt-6 divide-y divide-white/[.07] overflow-hidden rounded-2xl border border-white/[.08] bg-black/10">{records.map((record) => <HistoryRow key={record.id} record={record} onOpen={onOpen} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/[.1] bg-black/10 p-6 text-center"><Clock3 aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No personal investigations in this browser session yet.</p><p className="mt-1 text-xs leading-5 text-slate-600">Run your first evidence-backed investigation above.</p></div>}</CardContent></Card></section>;
}

function HistoryRow({ onOpen, record }: { onOpen: (record: InvestigationHistoryRecord) => void; record: InvestigationHistoryRecord }) {
  const Icon = evidenceIcons[record.evidenceKind];
  return <article className="grid gap-4 p-4 md:grid-cols-[1.15fr_.7fr_.75fr_.75fr_auto] md:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#8b78f6]/12 text-[#c9c1ff]"><Icon aria-hidden="true" className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{record.evidenceLabel}</p><p className="mt-1 font-mono text-[10px] tracking-[.08em] text-slate-600">{record.result.investigation.case_number}</p></div></div><HistoryMetric label="STATUS" value={record.result.investigation.status} /><HistoryMetric label="TYPE" value={record.investigationType.replaceAll("_", " ")} /><HistoryMetric label="VERDICT" value={record.result.investigation.verdict.replaceAll("_", " ")} /><Button type="button" variant="outline" onClick={() => onOpen(record)} className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white">Open Case <ArrowUpRight aria-hidden="true" className="size-3.5" /></Button><p className="md:col-span-5 flex items-center gap-1.5 text-[10px] text-slate-600"><ShieldCheck aria-hidden="true" className="size-3" />{formatDate(record.createdAt)} · Returned by the backend Risk Engine</p></article>;
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="font-mono text-[9px] tracking-[.12em] text-slate-600">{label}</p><p className="mt-1 text-xs capitalize text-slate-300">{value}</p></div>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
