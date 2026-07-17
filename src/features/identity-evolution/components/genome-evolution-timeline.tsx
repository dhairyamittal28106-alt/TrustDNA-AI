"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock3, GitCommitHorizontal, Sparkles } from "lucide-react";
import type { GenomeEvolutionState } from "@/features/identity-evolution/types";

export function GenomeEvolutionTimeline({ evolution }: { evolution: GenomeEvolutionState }) {
  const reduceMotion = useReducedMotion();
  return <section aria-labelledby="genome-evolution-heading" className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">LIVING GENOME</p><h2 id="genome-evolution-heading" className="mt-2 text-xl font-medium text-white">Identity Evolution</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Every recorded version shows what changed, the source coverage available to the browser, and the Guardian’s deterministic observation.</p></div><Clock3 aria-hidden="true" className="size-5 text-[#b6acff]" /></div>{evolution.versions.length ? <ol className="mt-6 space-y-5">{evolution.versions.map((entry, index) => <motion.li key={entry.version.id} initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * .045, duration: reduceMotion ? 0 : .28 }} className="relative flex gap-3"><div aria-hidden="true" className="flex w-5 shrink-0 flex-col items-center"><span className="mt-0.5 grid size-5 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><GitCommitHorizontal className="size-3" /></span>{index < evolution.versions.length - 1 && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-cyan-300/35 to-transparent" />}</div><article className="min-w-0 flex-1 rounded-2xl border border-white/[.07] bg-black/[.1] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-mono text-sm font-medium tracking-[.08em] text-cyan-100">GENOME {entry.version.version.toUpperCase()}</h3>{index === 0 && <span className="rounded-full border border-[#b8adff]/25 bg-[#8b78f6]/10 px-2 py-0.5 font-mono text-[8px] tracking-[.12em] text-[#cbc4ff]">CURRENT</span>}</div><time className="mt-1 block font-mono text-[9px] tracking-[.12em] text-slate-600" dateTime={entry.version.created_at}>{formatTimestamp(entry.version.created_at)}</time></div><div className="rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-right"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">COVERAGE CONFIDENCE</p><p className="mt-1 text-sm font-medium text-white">{entry.diff.confidence.current}% {entry.diff.confidence.delta !== undefined && <span className={entry.diff.confidence.delta >= 0 ? "text-cyan-200" : "text-amber-200"}>({formatDelta(entry.diff.confidence.delta)})</span>}</p></div></div><dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><EvolutionMetric label="Evidence added" value={entry.sourceLabel ?? "No client label recorded"} detail={entry.sourceLabel ? "Mapped to this session source" : "Historical source mapping unavailable"} /><EvolutionMetric label="Observed knowledge" value={entry.diff.observedKnowledgeAdded.length ? `+${entry.diff.observedKnowledgeAdded.length} term${entry.diff.observedKnowledgeAdded.length === 1 ? "" : "s"}` : "No new terms"} detail={entry.diff.observedKnowledgeAdded.length ? entry.diff.observedKnowledgeAdded.join(", ") : "Not treated as verified skills"} /><EvolutionMetric label="Version source count" value={`${entry.version.source_count} analyzed`} detail={`${formatDelta(entry.diff.sourceDelta)} from prior version`} /></dl><div className="mt-4 rounded-xl border border-[#aa9dff]/14 bg-[#8d79f7]/[.055] p-3"><div className="flex items-center gap-2"><Sparkles aria-hidden="true" className="size-3.5 text-[#c7c0ff]" /><p className="font-mono text-[9px] tracking-[.12em] text-[#d0caff]">GUARDIAN OBSERVATION</p></div><p className="mt-2 text-xs leading-5 text-slate-200">{entry.guardianInsight.observation}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{entry.guardianInsight.detail}</p></div>{entry.diff.changes.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{entry.diff.changes.slice(0, 4).map((change) => <li key={change.id} className="flex gap-2 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><ChangeIcon kind={change.kind} /><div><p className="text-xs font-medium text-slate-200">{change.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{change.detail}</p></div></li>)}</ul> : null}</article></motion.li>)}</ol> : <EmptyEvolution />}</section>;
}

function EvolutionMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><dt className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-xs font-medium text-slate-200">{value}</dd><p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p></div>;
}

function ChangeIcon({ kind }: { kind: "added" | "removed" | "updated" | "unchanged" }) {
  if (kind === "added") return <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />;
  if (kind === "removed") return <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 rotate-90 text-amber-200" />;
  return <ArrowUpRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[#c7c0ff]" />;
}

function EmptyEvolution() {
  return <div className="mt-6 rounded-xl border border-dashed border-white/[.1] bg-black/10 p-5 text-center"><Clock3 aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">Your Genome is waiting for its first version.</p><p className="mt-1 text-xs leading-5 text-slate-500">Analyze a supported text source to create the baseline for future evidence-backed comparisons.</p></div>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDelta(value: number): string {
  return `${value >= 0 ? "+" : ""}${value}`;
}
