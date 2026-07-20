"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, Check, CircleDotDashed, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import type { IdentityReasoningResult } from "@/features/identity-reasoning/types";

const stages = [
  "Intent detected",
  "Identity memory retrieved",
  "Evidence selected",
  "Relationships connected",
  "Decision bounded",
  "Confidence estimated",
  "Answer generated",
] as const;

type Point = { x: number; y: number };
const positions: Point[] = [{ x: 50, y: 10 }, { x: 80, y: 26 }, { x: 87, y: 60 }, { x: 62, y: 85 }, { x: 28, y: 82 }, { x: 10, y: 51 }, { x: 22, y: 21 }];

/** A visible, bounded representation of the reasoning result—not chain-of-thought. */
export function DigitalBrain({ reasoning }: { reasoning: IdentityReasoningResult }) {
  const reduceMotion = useReducedMotion();
  const nodes = reasoning.dimensions.slice(0, positions.length);
  const confidence = reasoning.confidence ?? 0;

  return <section aria-labelledby="digital-brain-heading" className="glass relative overflow-hidden rounded-[1.7rem] border border-cyan-300/[.14] p-5 sm:p-6">
    <div aria-hidden="true" className="absolute -right-24 -top-20 size-64 rounded-full bg-cyan-300/[.08] blur-3xl" />
    <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><BrainCircuit aria-hidden="true" className="size-4 text-cyan-200" /><p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">LIVING DIGITAL BRAIN</p></div><h3 id="digital-brain-heading" className="mt-2 text-lg font-medium text-white">Evidence moves through a visible decision boundary.</h3><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">The Twin exposes selected Identity Genome dimensions, confidence, and limits. It does not expose private hidden reasoning.</p></div><div className="grid size-16 place-items-center rounded-full border border-cyan-300/20 bg-[#061127]/85" style={{ background: `radial-gradient(closest-side, #071027 74%, transparent 75% 100%), conic-gradient(#7ee8ff ${confidence}%, rgba(255,255,255,.08) 0)` }}><span className="text-center font-mono text-xs font-semibold text-cyan-100">{reasoning.confidence === null ? "?" : `${confidence}%`}</span></div></div>
    <div className="relative mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,.65fr)]"><div className="relative min-h-72 overflow-hidden rounded-2xl border border-white/[.08] bg-[#050b21]/80"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(89_226_255_/_11%),transparent_43%)]" /><div aria-hidden="true" className="digital-brain-search absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/50" /><svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">{nodes.map((node, index) => { const point = positions[index]; return <motion.line key={node.id} x1="50" y1="50" x2={point.x} y2={point.y} stroke="rgb(126 232 255 / .55)" strokeWidth=".55" strokeDasharray="1.4 2" initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: reduceMotion ? 0 : index * .09, duration: reduceMotion ? 0 : .36 }} />; })}</svg><motion.div className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/40 bg-cyan-300/[.08] text-cyan-100 shadow-[0_0_35px_rgb(56_189_248_/_24%)]" animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}><BrainCircuit aria-hidden="true" className="size-6" /></motion.div>{nodes.map((node, index) => { const point = positions[index]; return <motion.div key={node.id} initial={reduceMotion ? false : { opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: reduceMotion ? 0 : .1 + index * .09, duration: reduceMotion ? 0 : .28 }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-cyan-300/20 bg-[#071127]/90 px-2.5 py-2 text-center shadow-lg" style={{ left: `${point.x}%`, top: `${point.y}%` }}><p className="font-mono text-[8px] tracking-[.09em] text-cyan-100">{node.label.toUpperCase()}</p><p className="mt-1 text-[9px] text-slate-500">{Math.round(node.confidence * 100)}% · {node.evidenceIds.length} evidence</p></motion.div>; })}{!nodes.length && <div className="absolute inset-0 grid place-items-center px-8 text-center"><div><ScanSearch aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm text-slate-300">Relevant memory not found</p><p className="mt-2 text-xs leading-5 text-slate-500">The Brain searched the permitted Genome dimensions and deliberately returned no unsupported claim.</p></div></div>}</div><div className="rounded-2xl border border-white/[.08] bg-black/[.14] p-4"><div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-cyan-200" /><p className="font-mono text-[9px] tracking-[.13em] text-cyan-100">EVIDENCE COMPOSITION</p></div><dl className="mt-4 space-y-3"><BrainMetric label="Selected dimensions" value={String(nodes.length)} /><BrainMetric label="Source-linked objects" value={String(reasoning.evidence.length)} /><BrainMetric label="Behavior signals" value={String(reasoning.behaviorPatterns.length)} /><BrainMetric label="Known gaps" value={String(reasoning.decision.missingEvidence.length)} /></dl><div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-amber-100">UNKNOWN FACTORS</p><p className="mt-1.5 text-[11px] leading-5 text-amber-50/75">{reasoning.decision.missingEvidence.length ? reasoning.decision.missingEvidence.join(" · ") : "No additional decision-specific factor was returned."}</p></div></div></div>
    <ol aria-label="Cognitive timeline" className="relative mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{stages.map((stage, index) => <motion.li key={stage} initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * .07, duration: reduceMotion ? 0 : .25 }} className="flex items-center gap-2 rounded-xl border border-white/[.07] bg-black/[.12] px-3 py-2.5"><span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-cyan-300/25 bg-cyan-300/[.07] text-cyan-100">{index === 0 ? <CircleDotDashed className="size-3" /> : index === stages.length - 1 ? <Sparkles className="size-3" /> : <Check className="size-3" />}</span><span className="text-[10px] leading-4 text-slate-300">{stage}</span></motion.li>)}</ol>
  </section>;
}

function BrainMetric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="font-mono text-xs text-slate-200">{value}</dd></div>;
}
