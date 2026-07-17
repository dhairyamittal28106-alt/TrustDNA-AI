"use client";

import { useState } from "react";
import { BrainCircuit, Clock3, Lightbulb, ShieldCheck, X } from "lucide-react";
import type { GuardianOverview } from "@/features/guardian/types";

type ConsoleTab = "overview" | "health" | "learning" | "recommendations" | "pending" | "timeline";

export function GuardianConsole({ overview, onClose }: { overview: GuardianOverview; onClose: () => void }) {
  const [tab, setTab] = useState<ConsoleTab>("overview");
  const tabs: Array<{ id: ConsoleTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "health", label: "Genome Health" },
    { id: "learning", label: "Recent Learning" },
    { id: "recommendations", label: "Recommendations" },
    { id: "pending", label: "Pending Evidence" },
    { id: "timeline", label: "Knowledge Timeline" },
  ];
  return <div className="fixed inset-0 z-50 grid place-items-end bg-[#020511]/70 p-4 backdrop-blur-sm sm:place-items-center" role="presentation"><section aria-labelledby="guardian-console-heading" aria-modal="true" role="dialog" className="glass max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[1.75rem] border border-white/[.13] bg-[#090d25]/95 p-5 shadow-2xl shadow-black/50 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">GUARDIAN CONSOLE</p><h2 id="guardian-console-heading" className="mt-2 text-2xl font-medium text-white">Evidence-bound companion</h2><p className="mt-2 text-sm leading-6 text-slate-400">The Guardian only displays current structured Identity Knowledge and recorded Genome state.</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl border border-white/[.1] text-slate-400 transition hover:bg-white/[.06] hover:text-white" aria-label="Close Guardian Console"><X aria-hidden="true" className="size-4" /></button></div><div aria-label="Guardian Console sections" className="mt-6 flex gap-2 overflow-x-auto border-b border-white/[.08] pb-3">{tabs.map((item) => <button type="button" key={item.id} onClick={() => setTab(item.id)} aria-pressed={tab === item.id} className={`shrink-0 rounded-lg px-3 py-2 text-xs transition ${tab === item.id ? "bg-[#8d79f7]/15 text-white" : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200"}`}>{item.label}</button>)}</div>{tab === "overview" && <Overview overview={overview} />}{tab === "health" && <Health overview={overview} />}{tab === "learning" && <Learning overview={overview} />}{tab === "recommendations" && <Recommendations overview={overview} />}{tab === "pending" && <PendingEvidence overview={overview} />}{tab === "timeline" && <KnowledgeTimeline overview={overview} />}</section></div>;
}

function Overview({ overview }: { overview: GuardianOverview }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-2"><Metric icon={BrainCircuit} label="Current activity" value={overview.activity} /><Metric icon={ShieldCheck} label="Genome status" value={overview.status} /><Metric icon={Lightbulb} label="Knowledge count" value={`${overview.knowledgeCount} active direct fact${overview.knowledgeCount === 1 ? "" : "s"}`} /><Metric icon={Clock3} label="Current version" value={overview.genomeVersion} /></div>;
}

function Health({ overview }: { overview: GuardianOverview }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={ShieldCheck} label="Genome confidence" value={overview.confidence === undefined ? "Awaiting coverage" : `${overview.confidence}%`} /><Metric icon={BrainCircuit} label="Structured knowledge" value={`${overview.knowledgeCount} fact${overview.knowledgeCount === 1 ? "" : "s"}`} /><Metric icon={Clock3} label="Last update" value={overview.lastUpdate ? formatDate(overview.lastUpdate) : "No update yet"} /></div>;
}

function Learning({ overview }: { overview: GuardianOverview }) {
  return <div className="mt-6 space-y-3">{overview.recentKnowledge.length ? overview.recentKnowledge.map((fact) => <article key={fact.id} className="rounded-xl border border-white/[.08] bg-black/[.12] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] tracking-[.13em] text-[#c7c0ff]">{fact.category.toUpperCase()}</p><h3 className="mt-1 text-sm font-medium text-white">{fact.title}: {fact.value}</h3></div><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.06] px-2 py-1 font-mono text-[8px] tracking-[.1em] text-cyan-100">{fact.provenance.version}</span></div><p className="mt-3 text-xs leading-5 text-slate-400">“{fact.provenance.evidence}”</p><p className="mt-2 text-[10px] text-slate-600">{fact.provenance.source} · {Math.round(fact.provenance.confidence * 100)}% confidence</p></article>) : <Empty label="No direct Identity Knowledge has been learned yet." />}</div>;
}

function Recommendations({ overview }: { overview: GuardianOverview }) {
  return <div className="mt-6 space-y-3">{overview.recommendations.length ? overview.recommendations.map((recommendation) => <article key={recommendation.id} className="rounded-xl border border-white/[.08] bg-black/[.12] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-medium text-white">{recommendation.title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{recommendation.detail}</p></div><span className="rounded-full border border-[#b8adff]/15 bg-[#8d79f7]/[.06] px-2 py-1 font-mono text-[8px] tracking-[.1em] text-[#c8c0ff]">{recommendation.availability === "available_now" ? "AVAILABLE" : "PLANNED"}</span></div></article>) : <Empty label="The current Identity Knowledge Graph has no pending evidence recommendation." />}</div>;
}

function PendingEvidence({ overview }: { overview: GuardianOverview }) {
  return <div className="mt-6"><p className="text-sm leading-6 text-slate-400">These recommendations identify evidence categories that are still absent from the current Identity Knowledge Graph. They do not imply an unavailable integration is connected.</p><div className="mt-4 space-y-3"><Recommendations overview={overview} /></div></div>;
}

function KnowledgeTimeline({ overview }: { overview: GuardianOverview }) {
  const facts = [...overview.recentKnowledge].sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp));
  return <div className="mt-6 space-y-3">{facts.length ? facts.map((fact) => <article key={fact.id} className="flex gap-3 rounded-xl border border-white/[.08] bg-black/[.12] p-4"><span className="mt-1 size-2 shrink-0 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(147,235,255,.8)]" /><div><p className="text-sm text-slate-200">{fact.title}: {fact.value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{formatDate(fact.provenance.timestamp)} · {fact.provenance.source} · {fact.provenance.version}</p></div></article>) : <Empty label="No versioned Identity Knowledge events are available yet." />}</div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof BrainCircuit; label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/[.12] p-4"><Icon aria-hidden="true" className="size-4 text-[#c7c0ff]" /><p className="mt-4 font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</p><p className="mt-2 text-sm leading-5 text-slate-200">{value}</p></div>;
}

function Empty({ label }: { label: string }) { return <div className="rounded-xl border border-dashed border-white/[.1] bg-black/[.1] p-5 text-sm text-slate-500">{label}</div>; }

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date); }
