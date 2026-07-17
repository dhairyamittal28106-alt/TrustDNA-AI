"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Database, GitCompareArrows, ShieldCheck, Sparkles } from "lucide-react";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export function IdentityFactsPanel({ facts, history }: { facts: IdentityKnowledgeObject[]; history: IdentityKnowledgeObject[] }) {
  const reduceMotion = useReducedMotion();
  const activeFacts = [...facts].sort((left, right) => factOrder(left.factKey) - factOrder(right.factKey) || left.title.localeCompare(right.title));
  const revisions = revisionGroups(history);

  return (
    <section aria-labelledby="identity-facts-heading" className="glass rounded-[1.65rem] border border-cyan-300/[.12] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">IDENTITY KNOWLEDGE GRAPH</p>
          <h2 id="identity-facts-heading" className="mt-2 text-2xl font-medium tracking-tight text-white">Identity Facts</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Only direct statements from consented evidence appear here. Current facts and their revisions retain version, timestamp, and source evidence.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[.06] px-3 py-2 font-mono text-[9px] tracking-[.13em] text-cyan-100"><ShieldCheck aria-hidden="true" className="size-3.5" />{activeFacts.length} CURRENT FACT{activeFacts.length === 1 ? "" : "S"}</span>
      </div>

      {activeFacts.length ? (
        <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeFacts.map((fact, index) => <FactCard key={fact.id} fact={fact} index={index} reduceMotion={reduceMotion} />)}
        </ul>
      ) : <EmptyFacts />}

      {revisions.length > 0 && (
        <section aria-labelledby="knowledge-revisions-heading" className="mt-6 rounded-2xl border border-[#b4a7ff]/15 bg-[#8b78f6]/[.055] p-4">
          <div className="flex items-center gap-2"><GitCompareArrows aria-hidden="true" className="size-4 text-[#c8c0ff]" /><div><p className="font-mono text-[9px] tracking-[.13em] text-[#c8c0ff]">KNOWLEDGE VERSION HISTORY</p><h3 id="knowledge-revisions-heading" className="mt-1 text-sm font-medium text-white">Current facts keep their direct-statement history.</h3></div></div>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">{revisions.map((revision) => <RevisionCard key={revision.current.id} {...revision} />)}</ul>
        </section>
      )}
    </section>
  );
}

function FactCard({ fact, index, reduceMotion }: { fact: IdentityKnowledgeObject; index: number; reduceMotion: boolean | null }) {
  return <motion.li initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .26, delay: reduceMotion ? 0 : index * .035 }} className="rounded-2xl border border-white/[.08] bg-black/[.12] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] tracking-[.13em] text-slate-500">{fact.category.toUpperCase()}</p><h3 className="mt-2 text-sm font-medium text-white">{fact.title}</h3></div><Sparkles aria-hidden="true" className="size-4 text-[#c5bdff]" /></div><p className="mt-3 text-base font-medium text-cyan-50">{fact.value}</p><span className="mt-3 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[.06] px-2 py-1 font-mono text-[8px] tracking-[.12em] text-cyan-100">CURRENT</span><EvidenceMeta fact={fact} /></motion.li>;
}

function RevisionCard({ current, historical }: { current: IdentityKnowledgeObject; historical: IdentityKnowledgeObject[] }) {
  return <li className="rounded-xl border border-white/[.07] bg-black/[.12] p-4"><p className="font-mono text-[9px] tracking-[.12em] text-[#c8c0ff]">{current.title.toUpperCase()}</p><div className="mt-3 rounded-xl border border-cyan-300/14 bg-cyan-300/[.045] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-cyan-100">CURRENT</p><p className="mt-1 text-sm font-medium text-white">{current.value}</p><EvidenceMeta fact={current} compact /></div><ul className="mt-3 space-y-2">{historical.map((fact) => <li key={fact.id} className="rounded-xl border border-white/[.06] bg-black/[.12] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-slate-500">HISTORY</p><p className="mt-1 text-xs text-slate-300 line-through">{fact.value}</p><EvidenceMeta fact={fact} compact /></li>)}</ul></li>;
}

function EvidenceMeta({ fact, compact = false }: { fact: IdentityKnowledgeObject; compact?: boolean }) {
  return <div className={compact ? "mt-2" : "mt-3"}><p className="rounded-xl border border-white/[.06] bg-white/[.025] p-2.5 text-[11px] leading-5 text-slate-400">&quot;{fact.provenance.evidence}&quot;</p><dl className="mt-3 grid grid-cols-2 gap-3"><FactMeta label="Version" value={fact.provenance.version} /><FactMeta label="Recorded" value={formatDate(fact.provenance.timestamp)} /><FactMeta label="Source" value={fact.provenance.source} /><FactMeta label="Confidence" value={`${Math.round(fact.provenance.confidence * 100)}%`} /></dl></div>;
}

function FactMeta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] tracking-[.11em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[10px] text-slate-300">{value}</dd></div>;
}

function EmptyFacts() {
  return <div className="mt-6 grid min-h-44 place-items-center rounded-2xl border border-dashed border-white/[.1] bg-black/[.1] p-6 text-center"><div><Database aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">No direct identity facts yet</p><p className="mt-2 max-w-md text-xs leading-5 text-slate-500">Add a consented text source with explicit statements such as your name, education, dream, projects, technical skills, or favorite cricketer. TrustDNA will not infer them.</p></div></div>;
}

function revisionGroups(history: IdentityKnowledgeObject[]): Array<{ current: IdentityKnowledgeObject; historical: IdentityKnowledgeObject[] }> {
  return Array.from(new Set(history.map((fact) => fact.factKey))).flatMap((factKey) => {
    const entries = history.filter((fact) => fact.factKey === factKey);
    const current = entries.find((fact) => fact.status === "active");
    const historical = entries.filter((fact) => fact.status === "superseded").sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp));
    return current && historical.length ? [{ current, historical }] : [];
  });
}

function factOrder(factKey: string): number {
  const ordered = ["name", "date_of_birth", "university", "degree", "department", "school", "career", "dream", "goal", "project", "programming_language", "framework", "favorite_player", "sport", "interest"];
  const index = ordered.indexOf(factKey);
  return index === -1 ? ordered.length : index;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
