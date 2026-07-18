"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2, CircleDot, FileSearch, GitBranch, Lightbulb, Network, ShieldCheck } from "lucide-react";
import type { IdentityReasoningResult, ReasoningGraphNode } from "@/features/identity-reasoning/types";

type IdentityReasoningTraceProps = {
  reasoning?: IdentityReasoningResult;
};

/** Visible, structured decision trace for an Identity Twin response. */
export function IdentityReasoningTrace({ reasoning }: IdentityReasoningTraceProps) {
  const reduceMotion = useReducedMotion();
  if (!reasoning) return null;

  const graphNodes = reasoning.graph.nodes.filter((node) => node.kind !== "question" && node.kind !== "decision");
  return <motion.section initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .35 }} aria-labelledby="identity-reasoning-heading" className="mt-5 space-y-5">
    <header className="glass overflow-hidden rounded-[1.7rem] border border-[#a99bff]/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><BrainCircuit aria-hidden="true" className="size-4 text-[#cbc5ff]" /><p className="font-mono text-[10px] tracking-[.16em] text-[#c9c2ff]">IDENTITY REASONING ENGINE</p></div><h2 id="identity-reasoning-heading" className="mt-2 text-xl font-semibold tracking-tight text-white">{reasoning.decision.label}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">A reproducible evidence trace—not a hidden chain-of-thought or a personality prediction.</p></div><div className="flex flex-wrap gap-3"><div className="min-w-28 rounded-2xl border border-white/[.1] bg-black/[.12] px-4 py-3"><p className="font-mono text-[9px] tracking-[.13em] text-slate-500">GENOME VERSION</p><p className="mt-1 text-sm font-semibold text-white">{reasoning.genomeVersion ?? "Unavailable"}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Reasoning boundary</p></div><div className="min-w-32 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] px-4 py-3"><p className="font-mono text-[9px] tracking-[.13em] text-cyan-100">EVIDENCE CONFIDENCE</p><p className="mt-1 text-2xl font-semibold text-white">{reasoning.confidence === null ? "Unknown" : `${reasoning.confidence}%`}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Evidence quality and relevance</p></div></div></div>
      <div className="mt-5 grid gap-3 border-t border-white/[.07] pt-5 md:grid-cols-[auto_1fr_auto_1fr_auto] md:items-center"><TraceAnchor label="Question" value="Received" /><ArrowRight aria-hidden="true" className="hidden size-4 text-[#8d81dc] md:block" /><TraceAnchor label="Evidence" value={`${reasoning.evidence.length} selected`} /><ArrowRight aria-hidden="true" className="hidden size-4 text-[#8d81dc] md:block" /><TraceAnchor label="Decision" value="Bounded" /></div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(20rem,.88fr)]">
      <section aria-labelledby="evidence-graph-heading" className="glass rounded-[1.7rem] border border-white/[.1] p-5 sm:p-6"><div className="flex items-start gap-3"><span className="rounded-xl border border-[#a99bff]/18 bg-[#8d79f7]/[.09] p-2"><Network aria-hidden="true" className="size-4 text-[#c5beff]" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#bdb5ff]">STRUCTURED TRACE</p><h3 id="evidence-graph-heading" className="mt-1 text-base font-medium text-white">Evidence graph</h3><p className="mt-1 text-xs leading-5 text-slate-500">Each node is stored or measured evidence connected to the decision boundary.</p></div></div>
        <div role="list" aria-label="Evidence graph nodes" className="mt-5 space-y-3"><GraphNode node={reasoning.graph.nodes.find((node) => node.kind === "question")} tone="question" />{graphNodes.length ? graphNodes.map((node) => <GraphNode key={node.id} node={node} tone={node.kind} />) : <p className="rounded-xl border border-dashed border-white/[.1] bg-black/[.12] px-4 py-3 text-xs leading-5 text-slate-500">No supported identity dimension was selected for this question.</p>}<GraphNode node={reasoning.graph.nodes.find((node) => node.kind === "decision")} tone="decision" /></div>
      </section>

      <section aria-labelledby="recommendation-heading" className="overflow-hidden rounded-[1.7rem] border border-cyan-300/18 bg-gradient-to-br from-cyan-300/[.09] via-[#8d79f7]/[.08] to-black/[.12] p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-cyan-200" /><p className="font-mono text-[10px] tracking-[.14em] text-cyan-100">RECOMMENDATION</p></div><p className="mt-3 text-xs leading-5 text-slate-400">{reasoning.decision.summary}</p><h3 id="recommendation-heading" className="mt-4 text-lg font-semibold leading-7 text-white">{reasoning.decision.recommendation}</h3><div className="mt-5 rounded-2xl border border-white/[.09] bg-black/[.16] p-4"><div className="flex items-start gap-2"><Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#cdc7ff]" /><div><p className="text-xs font-medium text-slate-100">Alternative view</p><p className="mt-1 text-xs leading-5 text-slate-400">{reasoning.decision.alternativeView}</p></div></div></div><div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[.06] p-4"><div className="flex items-start gap-2"><AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-amber-50">Missing evidence</p><ul className="mt-2 space-y-1.5">{reasoning.decision.missingEvidence.map((item) => <li key={item} className="text-[11px] leading-4 text-amber-100/75">{item}</li>)}</ul></div></div></div></section>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <section aria-labelledby="dimensions-heading" className="glass rounded-[1.7rem] border border-white/[.1] p-5 sm:p-6"><div className="flex items-center gap-2"><CircleDot aria-hidden="true" className="size-4 text-[#c4bdff]" /><div><p className="font-mono text-[10px] tracking-[.14em] text-[#bdb5ff]">PROFILE INPUTS</p><h3 id="dimensions-heading" className="mt-1 text-base font-medium text-white">Identity dimensions used</h3></div></div>{reasoning.dimensions.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{reasoning.dimensions.map((dimension) => <article key={dimension.id} className="rounded-2xl border border-white/[.08] bg-black/[.13] p-4"><div className="flex items-start justify-between gap-3"><p className="text-xs font-medium text-slate-100">{dimension.label}</p><span className="font-mono text-[9px] text-cyan-100">{Math.round(dimension.confidence * 100)}%</span></div><p className="mt-2 text-xs leading-5 text-slate-300">{dimension.value}</p><p className="mt-3 font-mono text-[9px] tracking-[.08em] text-slate-600">{dimension.version} · {formatTimestamp(dimension.timestamp)}</p><p className="mt-2 text-[10px] leading-4 text-slate-500">{dimension.source}</p></article>)}</div> : <EmptyPanel text="No stored Identity Genome dimension is relevant enough to use." />}</section>

      <section aria-labelledby="signals-heading" className="glass rounded-[1.7rem] border border-white/[.1] p-5 sm:p-6"><div className="flex items-center gap-2"><GitBranch aria-hidden="true" className="size-4 text-[#c4bdff]" /><div><p className="font-mono text-[10px] tracking-[.14em] text-[#bdb5ff]">DETERMINISTIC SIGNALS</p><h3 id="signals-heading" className="mt-1 text-base font-medium text-white">Behavior evidence used</h3></div></div>{reasoning.behaviorPatterns.length ? <ul className="mt-5 space-y-3">{reasoning.behaviorPatterns.map((pattern) => <li key={pattern.id} className="rounded-2xl border border-white/[.08] bg-black/[.13] p-4"><div className="flex items-start justify-between gap-3"><p className="text-xs font-medium text-slate-100">{pattern.label}</p><span className="font-mono text-[9px] text-cyan-100">{Math.round(pattern.confidence * 100)}%</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{pattern.detail}</p></li>)}</ul> : <EmptyPanel text="No behavioral pattern is displayed without supporting structured evidence." />}</section>
    </div>

    <section aria-labelledby="supporting-evidence-heading" className="glass rounded-[1.7rem] border border-white/[.1] p-5 sm:p-6"><div className="flex items-center gap-2"><FileSearch aria-hidden="true" className="size-4 text-cyan-200" /><div><p className="font-mono text-[10px] tracking-[.14em] text-cyan-100">AUDIT TRAIL</p><h3 id="supporting-evidence-heading" className="mt-1 text-base font-medium text-white">Supporting evidence</h3></div></div>{reasoning.evidence.length ? <div className="mt-5 grid gap-3 lg:grid-cols-2">{reasoning.evidence.map((item) => <article key={item.id} className="rounded-2xl border border-white/[.08] bg-black/[.13] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-slate-100">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{item.value}</p></div><span className="font-mono text-[9px] text-cyan-100">{Math.round(item.weight * 100)} wt</span></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{item.evidence}</p><div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] tracking-[.06em] text-slate-600"><span>{item.source}</span><span>{item.version}</span><span>{formatTimestamp(item.timestamp)}</span></div></article>)}</div> : <EmptyPanel text="No direct, relevant evidence was selected. The decision remains intentionally bounded." />}</section>
  </motion.section>;
}

function GraphNode({ node, tone }: { node: ReasoningGraphNode | undefined; tone: ReasoningGraphNode["kind"] }) {
  if (!node) return null;
  const style = tone === "question" ? "border-[#a99bff]/30 bg-[#8d79f7]/[.11] text-[#e0dcff]" : tone === "decision" ? "border-cyan-300/25 bg-cyan-300/[.08] text-cyan-50" : "border-white/[.09] bg-black/[.13] text-slate-200";
  return <div role="listitem" className="relative pl-7"><span aria-hidden="true" className="absolute bottom-[-.8rem] left-2.5 top-[-.8rem] w-px bg-white/[.08]" /><span aria-hidden="true" className={`absolute left-0 top-3 size-5 rounded-full border ${style}`}><CheckCircle2 className="m-0.5 size-3" /></span><div className={`rounded-xl border px-3.5 py-3 text-xs ${style}`}><p className="font-mono text-[9px] tracking-[.1em] opacity-60">{tone.toUpperCase()}</p><p className="mt-1 leading-5">{node.label}</p></div></div>;
}

function TraceAnchor({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/[.12] px-3 py-2.5"><p className="font-mono text-[8px] tracking-[.1em] text-slate-600">{label.toUpperCase()}</p><p className="mt-1 text-[11px] font-medium text-slate-200">{value}</p></div>;
}

function EmptyPanel({ text }: { text: string }) {
  return <p className="mt-5 rounded-2xl border border-dashed border-white/[.1] bg-black/[.1] px-4 py-4 text-xs leading-5 text-slate-500">{text}</p>;
}

function formatTimestamp(value: string): string {
  if (value === "Unknown") return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
