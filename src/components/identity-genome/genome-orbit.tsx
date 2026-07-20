"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, BrainCircuit, BriefcaseBusiness, Fingerprint, GraduationCap, HeartHandshake, MessageSquareText, Network, ScanSearch, Target, type LucideIcon } from "lucide-react";
import type { GenomeHologramSignal, GenomeOrbitNode } from "@/components/identity-genome/types";

type GenomeOrbitProps = {
  signals: GenomeHologramSignal[];
  activeSignalIds: string[];
  genomeVersion?: string;
  onSignalFocus?: (signalId: string) => void;
  isCoreActive: boolean;
};

const positions = [
  [50, 6], [75, 15], [90, 32], [92, 55], [81, 78], [64, 91],
  [36, 91], [19, 78], [8, 55], [10, 32], [25, 15],
] as const;

const icons: Record<string, LucideIcon> = {
  identity: Fingerprint,
  education: GraduationCap,
  career: Target,
  projects: BriefcaseBusiness,
  skills: BrainCircuit,
  values: HeartHandshake,
  goals: Target,
  communication: MessageSquareText,
  behavior: Activity,
  knowledge: Network,
  evidence: ScanSearch,
};

function signalById(signals: GenomeHologramSignal[], id: string) {
  return signals.find((signal) => signal.id === id);
}

function aggregate(signals: GenomeHologramSignal[], ids: string[]) {
  const matched = ids.map((id) => signalById(signals, id)).filter((signal): signal is GenomeHologramSignal => Boolean(signal));
  const evidenceCount = matched.reduce((total, signal) => total + signal.evidenceCount, 0);
  const confidenceSignals = matched.filter((signal) => signal.confidence !== null);
  const confidence = confidenceSignals.length
    ? confidenceSignals.reduce((total, signal) => total + (signal.confidence ?? 0), 0) / confidenceSignals.length
    : null;
  return { evidenceCount, confidence, lastUpdated: matched.map((signal) => signal.lastUpdated).filter(Boolean).sort().at(-1), version: matched.find((signal) => signal.version)?.version };
}

/** Maps existing explainable signals into a fixed semantic orbit. */
export function buildGenomeOrbitNodes(signals: GenomeHologramSignal[], genomeVersion?: string): GenomeOrbitNode[] {
  const definitions: Array<{ id: string; label: string; sourceSignalIds: string[] }> = [
    { id: "identity", label: "Identity", sourceSignalIds: ["identity"] },
    { id: "education", label: "Education", sourceSignalIds: ["education"] },
    { id: "career", label: "Career", sourceSignalIds: ["dreams", "goals", "motivations"] },
    { id: "projects", label: "Projects", sourceSignalIds: ["projects"] },
    { id: "skills", label: "Skills", sourceSignalIds: ["skills"] },
    { id: "values", label: "Values", sourceSignalIds: ["values"] },
    { id: "goals", label: "Goals", sourceSignalIds: ["goals", "dreams"] },
    { id: "communication", label: "Communication", sourceSignalIds: ["communication"] },
    { id: "behavior", label: "Behavior", sourceSignalIds: ["behavior_patterns"] },
    { id: "knowledge", label: "Knowledge", sourceSignalIds: signals.map((signal) => signal.id) },
    { id: "evidence", label: "Evidence", sourceSignalIds: signals.map((signal) => signal.id) },
  ];

  return definitions.map((definition, index) => {
    const data = aggregate(signals, definition.sourceSignalIds);
    return { ...definition, ...data, id: definition.id, label: definition.label, icon: icons[definition.id], version: data.version ?? genomeVersion, position: positions[index] };
  });
}

export function GenomeOrbit({ signals, activeSignalIds, genomeVersion, onSignalFocus, isCoreActive }: GenomeOrbitProps) {
  const reduceMotion = useReducedMotion();
  const nodes = buildGenomeOrbitNodes(signals, genomeVersion);
  const active = new Set(activeSignalIds);
  const connectedNodes = nodes.filter((node) => node.sourceSignalIds.some((id) => active.has(id)));

  return <>
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden size-full md:block" viewBox="0 0 100 100" preserveAspectRatio="none">
      {nodes.map((node, index) => {
        const [x, y] = node.position;
        const nodeActive = isCoreActive || node.sourceSignalIds.some((id) => active.has(id));
        return <motion.line key={node.id} x1={x} y1={y} x2="50" y2="50" className={nodeActive ? "genome-neural-link genome-neural-link-active" : "genome-neural-link"} initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: node.evidenceCount ? nodeActive ? .72 : .2 : .06 }} transition={{ duration: reduceMotion ? 0 : .7, delay: reduceMotion ? 0 : index * .035 }} />;
      })}
    </svg>
    <div aria-label="Identity dimensions" className="absolute inset-0 z-30 hidden md:block">
      {nodes.map((node, index) => <OrbitNode key={node.id} node={node} active={isCoreActive || node.sourceSignalIds.some((id) => active.has(id))} reduceMotion={reduceMotion} onFocus={() => onSignalFocus?.(node.sourceSignalIds[0] ?? node.id)} index={index} />)}
    </div>
    <div className="absolute inset-x-4 bottom-3 z-30 grid grid-cols-2 gap-2 rounded-2xl border border-white/[.08] bg-[#071024]/75 p-2 backdrop-blur-sm sm:grid-cols-3 md:hidden" aria-label="Identity dimensions">
      {nodes.map((node) => <MobileOrbitNode key={node.id} node={node} active={isCoreActive || node.sourceSignalIds.some((id) => active.has(id))} onFocus={() => onSignalFocus?.(node.sourceSignalIds[0] ?? node.id)} />)}
    </div>
    <p className="sr-only" aria-live="polite">{connectedNodes.length ? `${connectedNodes.length} Identity Genome dimensions are active in the current evidence path.` : "Identity dimensions are available as evidence is added."}</p>
  </>;
}

function OrbitNode({ node, active, reduceMotion, onFocus, index }: { node: GenomeOrbitNode; active: boolean; reduceMotion: boolean | null; onFocus: () => void; index: number }) {
  const [left, top] = node.position;
  const Icon = node.icon;
  const evidenceLabel = `${node.evidenceCount} evidence item${node.evidenceCount === 1 ? "" : "s"}`;
  const tooltipPosition = top > 65 ? "bottom-[calc(100%+.45rem)]" : "top-[calc(100%+.45rem)]";
  return <motion.button
    type="button"
    onClick={onFocus}
    aria-label={`${node.label}. ${evidenceLabel}. ${node.confidence === null ? "Confidence is being assembled." : `${Math.round(node.confidence * 100)} percent confidence.`}`}
    className={`genome-orbit-node group absolute -translate-x-1/2 -translate-y-1/2 text-left outline-none ${active ? "genome-orbit-node-active" : ""} ${node.evidenceCount ? "" : "genome-orbit-node-empty"}`}
    style={{ left: `${left}%`, top: `${top}%` }}
    animate={reduceMotion ? undefined : { y: [0, index % 2 ? 2 : -2, 0], scale: active ? [1, 1.055, 1] : 1 }}
    transition={{ duration: 5.5 + index * .2, repeat: Infinity, ease: "easeInOut" }}
  >
    <span className="flex items-center gap-1.5 rounded-full border border-current/25 bg-[#081126]/85 px-2.5 py-1.5 shadow-[0_0_24px_rgb(34_211_238_/_8%)] transition duration-300 group-hover:border-current/70 group-hover:bg-cyan-300/[.1] group-hover:shadow-[0_0_30px_rgb(34_211_238_/_22%)] group-focus-visible:border-cyan-100 group-focus-visible:ring-2 group-focus-visible:ring-cyan-100/75">
      <Icon aria-hidden="true" className="size-3 shrink-0" />
      <span className="font-mono text-[8px] font-semibold tracking-[.11em] text-slate-100">{node.label.toUpperCase()}</span>
    </span>
    <span role="tooltip" className={`pointer-events-none absolute left-1/2 ${tooltipPosition} w-44 -translate-x-1/2 rounded-xl border border-white/[.12] bg-[#070b1d]/95 px-3 py-2 font-mono text-[9px] leading-4 text-slate-300 opacity-0 shadow-2xl transition group-hover:opacity-100 group-focus-visible:opacity-100`}>
      <span className="block text-cyan-100">{node.label} · {evidenceLabel}</span>
      <span className="block text-slate-500">{node.confidence === null ? "Knowledge graph assembling" : `${Math.round(node.confidence * 100)}% confidence`} · {node.version ?? "Initial assembly"}</span>
    </span>
  </motion.button>;
}

function MobileOrbitNode({ node, active, onFocus }: { node: GenomeOrbitNode; active: boolean; onFocus: () => void }) {
  const Icon = node.icon;
  return <button type="button" onClick={onFocus} className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-100 ${active ? "border-cyan-200/45 bg-cyan-300/[.1] text-cyan-100" : node.evidenceCount ? "border-white/[.1] bg-white/[.025] text-slate-200" : "border-white/[.06] bg-transparent text-slate-500"}`}><Icon aria-hidden="true" className="size-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate font-mono text-[9px] tracking-[.08em]">{node.label.toUpperCase()}</span><span className="block text-[10px] text-slate-500">{node.evidenceCount} evidence</span></span></button>;
}
