"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2, CircleAlert, Minus, Plus, RefreshCw } from "lucide-react";
import { GenomeDiffEngine } from "@/features/identity-evolution/genome-diff-engine";
import type { GenomeEvolutionState } from "@/features/identity-evolution/types";

const diffEngine = new GenomeDiffEngine();

export function GenomeDiffPanel({ evolution }: { evolution: GenomeEvolutionState }) {
  const versions = evolution.versions.map((entry) => entry.version);
  const [fromId, setFromId] = useState(versions[1]?.id ?? versions[0]?.id ?? "");
  const [toId, setToId] = useState(versions[0]?.id ?? "");

  const from = versions.find((version) => version.id === fromId);
  const to = versions.find((version) => version.id === toId);
  const diff = useMemo(() => to ? diffEngine.compare(from?.id === to.id ? undefined : from, to) : undefined, [from, to]);

  return <section aria-labelledby="genome-diff-heading" className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">VERSION COMPARISON</p><h2 id="genome-diff-heading" className="mt-2 text-xl font-medium text-white">Genome Diff</h2><p className="mt-2 text-xs leading-5 text-slate-400">Compare real version snapshots. TrustDNA shows observed evidence changes, not inferred skills or personality traits.</p></div><ArrowRightLeft aria-hidden="true" className="size-5 text-[#b6acff]" /></div>{versions.length ? <><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><VersionSelect label="From version" value={fromId} versions={versions} onChange={setFromId} /><ArrowRightLeft aria-hidden="true" className="mx-auto size-4 self-end text-slate-500 sm:mb-3" /><VersionSelect label="To version" value={toId} versions={versions} onChange={setToId} /></div>{diff ? <div className="mt-5"><div className="grid gap-3 sm:grid-cols-3"><DiffMetric label="Observed terms added" value={diff.observedKnowledgeAdded.length ? `+${diff.observedKnowledgeAdded.length}` : "0"} tone="cyan" /><DiffMetric label="Observed terms removed" value={diff.observedKnowledgeRemoved.length ? `-${diff.observedKnowledgeRemoved.length}` : "0"} tone="amber" /><DiffMetric label="Coverage confidence" value={diff.confidence.delta === undefined ? `${diff.confidence.current}%` : `${diff.confidence.current}% (${formatDelta(diff.confidence.delta)})`} tone="violet" /></div>{diff.changes.length ? <ul className="mt-4 space-y-2">{diff.changes.map((change) => <li key={change.id} className="flex gap-3 rounded-xl border border-white/[.07] bg-black/[.1] p-3"><DiffIcon kind={change.kind} /><div><p className="text-xs font-medium text-slate-200">{change.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{change.detail}</p></div></li>)}</ul> : <div className="mt-4 rounded-xl border border-dashed border-white/[.08] bg-black/[.08] p-4 text-xs leading-5 text-slate-500">No explainable feature difference is available between these versions.</div>}<div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3"><div className="flex gap-2"><CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-amber-50">Comparison boundary</p><ul className="mt-1.5 space-y-1">{diff.limitations.map((limitation) => <li key={limitation} className="text-[11px] leading-4 text-amber-100/70">{limitation}</li>)}</ul></div></div></div></div> : null}</> : <div className="mt-6 rounded-xl border border-dashed border-white/[.1] bg-black/10 p-5 text-center"><RefreshCw aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">Version comparison activates after the first analysis.</p><p className="mt-1 text-xs leading-5 text-slate-500">Add supported evidence to create a baseline Genome version.</p></div>}</section>;
}

function VersionSelect({ label, value, versions, onChange }: { label: string; value: string; versions: GenomeEvolutionState["versions"][number]["version"][]; onChange: (value: string) => void }) {
  return <label className="block"><span className="font-mono text-[9px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</span><select className="mt-2 h-11 w-full rounded-xl border border-white/[.1] bg-[#080a1e] px-3 text-sm text-slate-200 outline-none focus:border-[#a99bff]/60 focus:ring-2 focus:ring-[#a99bff]/20" value={value} onChange={(event) => onChange(event.target.value)}>{versions.map((version) => <option key={version.id} value={version.id}>{version.version} · {formatTimestamp(version.created_at)}</option>)}</select></label>;
}

function DiffMetric({ label, value, tone }: { label: string; value: string; tone: "cyan" | "amber" | "violet" }) {
  const colors = { cyan: "text-cyan-100", amber: "text-amber-100", violet: "text-[#d0caff]" };
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</p><p className={`mt-1 text-lg font-semibold ${colors[tone]}`}>{value}</p></div>;
}

function DiffIcon({ kind }: { kind: "added" | "removed" | "updated" | "unchanged" }) {
  if (kind === "added") return <Plus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-cyan-300" />;
  if (kind === "removed") return <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" />;
  if (kind === "updated") return <RefreshCw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#c7c0ff]" />;
  return <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function formatDelta(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}
