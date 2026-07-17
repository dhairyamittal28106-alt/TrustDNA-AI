"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Database, GitCompareArrows, ShieldCheck, Sparkles } from "lucide-react";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export function IdentityFactsPanel({ facts, history }: { facts: IdentityKnowledgeObject[]; history: IdentityKnowledgeObject[] }) {
  const reduceMotion = useReducedMotion();
  const conflicts = conflictPairs(history);

  return <section aria-labelledby="identity-facts-heading" className="glass rounded-[1.65rem] border border-cyan-300/[.12] p-5 shadow-2xl shadow-black/20 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">IDENTITY KNOWLEDGE GRAPH</p><h2 id="identity-facts-heading" className="mt-2 text-2xl font-medium tracking-tight text-white">Identity Facts</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Only direct statements from consented evidence appear here. Each fact keeps the evidence, source, confidence, and Genome version that support it.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-2 font-mono text-[9px] tracking-[.13em] text-cyan-100"><ShieldCheck aria-hidden="true" className="size-3.5" />{facts.length} ACTIVE FACT{facts.length === 1 ? "" : "S"}</span></div>
    {facts.length ? <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{facts.map((fact, index) => <motion.li key={fact.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .26, delay: reduceMotion ? 0 : index * .035 }} className="rounded-2xl border border-white/[.08] bg-black/[.12] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] tracking-[.13em] text-slate-500">{fact.category.toUpperCase()}</p><h3 className="mt-2 text-sm font-medium text-white">{fact.title}</h3></div><Sparkles aria-hidden="true" className="size-4 text-[#c5bdff]" /></div><p className="mt-3 text-base font-medium text-cyan-50">{fact.value}</p><p className="mt-3 rounded-xl border border-white/[.06] bg-white/[.025] p-2.5 text-[11px] leading-5 text-slate-400">“{fact.provenance.evidence}”</p><dl className="mt-4 grid grid-cols-2 gap-3"><FactMeta label="Source" value={fact.provenance.source} /><FactMeta label="Confidence" value={`${Math.round(fact.provenance.confidence * 100)}%`} /><FactMeta label="Genome" value={fact.provenance.version} /><FactMeta label="Recorded" value={formatDate(fact.provenance.timestamp)} /></dl></motion.li>)}</ul> : <EmptyFacts />}
    {conflicts.length > 0 && <section aria-labelledby="knowledge-conflicts-heading" className="mt-6 rounded-2xl border border-[#b4a7ff]/15 bg-[#8b78f6]/[.055] p-4"><div className="flex items-center gap-2"><GitCompareArrows aria-hidden="true" className="size-4 text-[#c8c0ff]" /><div><p className="font-mono text-[9px] tracking-[.13em] text-[#c8c0ff]">KNOWLEDGE VERSION HISTORY</p><h3 id="knowledge-conflicts-heading" className="mt-1 text-sm font-medium text-white">Updated facts remain explainable.</h3></div></div><ul className="mt-4 space-y-3">{conflicts.map(({ previous, current }) => <li key={`${previous.id}-${current.id}`} className="grid gap-2 rounded-xl border border-white/[.07] bg-black/[.12] p-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">{previous.provenance.version.toUpperCase()}</p><p className="mt-1 text-xs text-slate-400 line-through">{previous.value}</p></div><span aria-hidden="true" className="font-mono text-xs text-[#c8c0ff]">→</span><div><p className="font-mono text-[8px] tracking-[.12em] text-cyan-100">{current.provenance.version.toUpperCase()} · ACTIVE</p><p className="mt-1 text-xs font-medium text-white">{current.value}</p></div></li>)}</ul></section>}
  </section>;
}

function FactMeta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] tracking-[.11em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[10px] text-slate-300">{value}</dd></div>;
}

function EmptyFacts() {
  return <div className="mt-6 grid min-h-44 place-items-center rounded-2xl border border-dashed border-white/[.1] bg-black/[.1] p-6 text-center"><div><Database aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">No direct identity facts yet</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">Add a consented text source with explicit statements such as your name, education, dream, projects, skills, or favorite player. TrustDNA will not infer them.</p></div></div>;
}

function conflictPairs(history: IdentityKnowledgeObject[]): Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }> {
  const pairs: Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }> = [];
  const keys = Array.from(new Set(history.map((fact) => fact.factKey)));
  for (const key of keys) {
    const entries = history.filter((fact) => fact.factKey === key);
    const previous = entries.find((fact) => fact.status === "superseded");
    const current = entries.find((fact) => fact.status === "active");
    if (previous && current) pairs.push({ previous, current });
  }
  return pairs;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}
