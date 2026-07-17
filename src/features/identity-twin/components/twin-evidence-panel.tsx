"use client";

import Link from "next/link";
import { Database, ExternalLink, FileClock, Fingerprint, GitBranch, LibraryBig, ShieldCheck } from "lucide-react";
import { ProvenanceBadge } from "@/features/identity-intelligence/components/provenance-badge";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinResponse } from "@/features/identity-twin/types";

export function TwinEvidencePanel({ response, snapshot }: { response?: TwinResponse; snapshot: GenomeSnapshot }) {
  const bundle = response?.evidenceBundle;
  const sections = bundle?.sections ?? [];
  const evidence = response?.evidenceUsed ?? [];
  const timeline = bundle?.timeline ?? [];
  const sources = bundle?.sources ?? [];

  return <aside aria-labelledby="twin-evidence-heading" className="glass h-fit rounded-[1.5rem] border border-white/[.1] p-5 xl:sticky xl:top-24"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">EVIDENCE PANEL</p><h2 id="twin-evidence-heading" className="mt-1 text-base font-medium text-white">What informed this answer</h2></div><ShieldCheck aria-hidden="true" className="size-4 text-cyan-200" /></div><p className="mt-2 text-xs leading-5 text-slate-400">Each visible item comes from the existing Identity Genome snapshot.</p>{response ? <><EvidenceGroup icon={LibraryBig} title="Genome sections used" empty="No Genome section supports this answer.">{sections.map((section) => <div key={section.id} className="rounded-xl border border-white/[.07] bg-black/[.12] p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-200">{section.title}</p><ProvenanceBadge origin={section.origin} /></div><p className="mt-1 text-[11px] leading-4 text-slate-500">{section.description}</p></div>)}</EvidenceGroup><EvidenceGroup icon={Database} title="Knowledge objects" empty="No relevant knowledge objects were selected.">{evidence.map((item) => <div key={item.id} className="rounded-xl border border-white/[.07] bg-black/[.12] p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-200">{item.title}</p><ProvenanceBadge origin={item.origin} /></div><p className="mt-1 text-[11px] leading-4 text-slate-400">{item.detail}</p></div>)}</EvidenceGroup><EvidenceGroup icon={FileClock} title="Genome evidence timeline" empty="No recorded timeline references are available.">{timeline.slice(0, 3).map((event) => <div key={event.id} className="border-l border-[#a99bff]/30 pl-3"><p className="text-xs text-slate-300">{event.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{event.detail}</p>{event.timestamp && <p className="mt-1 font-mono text-[9px] tracking-[.1em] text-slate-600">{formatTimestamp(event.timestamp)}</p>}</div>)}</EvidenceGroup><EvidenceGroup icon={GitBranch} title="Analyzed source coverage" empty="No session source coverage is available.">{sources.map((source) => <div key={source.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[.07] bg-black/[.12] px-3 py-2"><p className="text-xs text-slate-300">{source.label}</p><span className="font-mono text-[8px] tracking-[.1em] text-cyan-100">INGESTED</span></div>)}</EvidenceGroup><div className="mt-5 rounded-xl border border-[#a99bff]/15 bg-[#8d79f7]/[.06] p-3"><div className="flex items-center gap-2"><Fingerprint aria-hidden="true" className="size-3.5 text-[#c7c0ff]" /><p className="font-mono text-[9px] tracking-[.12em] text-[#d0caff]">RESPONSE BOUNDARY</p></div><dl className="mt-3 grid grid-cols-2 gap-3"><EvidenceMetric label="Genome version" value={bundle?.version ?? "Unavailable"} /><EvidenceMetric label="Coverage confidence" value={bundle?.genomeConfidence === undefined ? "Unknown" : `${bundle.genomeConfidence}%`} /></dl><p className="mt-3 text-[10px] leading-4 text-slate-500">Source labels show analyzed coverage. The current backend does not expose per-trait source attribution.</p></div>{response.suggestedSources.length > 0 && <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3"><p className="font-mono text-[9px] tracking-[.12em] text-amber-100">TO IMPROVE THIS ANSWER</p><ul className="mt-2 space-y-1.5">{response.suggestedSources.map((source) => <li key={source} className="text-[11px] leading-4 text-amber-50/75">{source}</li>)}</ul></div>}</> : <EmptyEvidenceState hasEvidence={snapshot.hasExtractedKnowledge} />}</aside>;
}

function EvidenceGroup({ icon: Icon, title, empty, children }: { icon: typeof LibraryBig; title: string; empty: string; children: React.ReactNode[] }) {
  const hasChildren = children.length > 0;
  return <section className="mt-5"><div className="flex items-center gap-2"><Icon aria-hidden="true" className="size-3.5 text-[#bcb4ff]" /><h3 className="font-mono text-[9px] tracking-[.13em] text-slate-500">{title.toUpperCase()}</h3></div><div className="mt-2 space-y-2">{hasChildren ? children : <p className="rounded-xl border border-dashed border-white/[.08] bg-black/[.08] px-3 py-2.5 text-[11px] leading-4 text-slate-600">{empty}</p>}</div></section>;
}

function EmptyEvidenceState({ hasEvidence }: { hasEvidence: boolean }) {
  return <div className="mt-7 rounded-2xl border border-dashed border-white/[.1] bg-black/[.1] p-4"><p className="text-sm font-medium text-slate-300">{hasEvidence ? "Ask a question to open the evidence trace." : "Your Twin is awaiting its first evidence source."}</p><p className="mt-2 text-xs leading-5 text-slate-500">{hasEvidence ? "Every answer will show its Genome sections, knowledge objects, version, and evidence boundary here." : "Start with a consented writing sample. TrustDNA will make only deterministic communication signals available to the Twin."}</p><Link href="/genome" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#c3bbff] hover:text-white">Open Identity Genome <ExternalLink aria-hidden="true" className="size-3.5" /></Link></div>;
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] tracking-[.1em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[11px] font-medium text-slate-200">{value}</dd></div>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
