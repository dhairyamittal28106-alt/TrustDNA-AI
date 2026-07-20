"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, CircleDot, ScanLine } from "lucide-react";
import { GenomeOrbit, buildGenomeOrbitNodes } from "@/components/identity-genome/genome-orbit";
import { GenomeSignalStrip } from "@/components/identity-genome/genome-signal-strip";
import { LivingHologramCore } from "@/components/identity-genome/living-hologram-core";
import type { GenomeAssemblyState, HologramPhase } from "@/components/identity-genome/types";
import { genomeHealth, type GenomeHologramSignal } from "@/features/identity-intelligence/hologram-signals";

type IdentityGenomeHologramProps = {
  phase: HologramPhase;
  identityLabel: string;
  trustRating?: string;
  genomeVersion?: string;
  confidence?: number;
  status: string;
  currentState: string;
  compact?: boolean;
  signals?: GenomeHologramSignal[];
  activeSignalIds?: string[];
  sourceCount?: number;
  knowledgeObjectCount?: number;
  lastSynchronized?: string;
  onSignalFocus?: (signalId: string) => void;
};

const phaseStates: Record<HologramPhase, GenomeAssemblyState> = {
  idle: { label: "GENOME READY", detail: "Listening for explainable Identity Genome activity.", tone: "cyan", isAssembling: false, isStable: true },
  genome_creation: { label: "GENOME ASSEMBLY", detail: "Scanning consented evidence and building your knowledge graph.", tone: "sky", isAssembling: true, isStable: false },
  genesis: { label: "BUILDING KNOWLEDGE GRAPH", detail: "Integrating new evidence into the versioned Identity Genome.", tone: "sky", isAssembling: true, isStable: false },
  cipher: { label: "SCANNING COMMUNICATION", detail: "Correlating explainable communication signals.", tone: "cyan", isAssembling: true, isStable: false },
  chronos: { label: "SYNCHRONIZING IDENTITY", detail: "Validating the chronology of observed evidence.", tone: "violet", isAssembling: true, isStable: false },
  forensiq: { label: "ANALYZING EVIDENCE", detail: "Inspecting deterministic evidence features.", tone: "violet", isAssembling: true, isStable: false },
  spectra: { label: "SCANNING SIGNAL LAYER", detail: "Resolving the available artifact signal layer.", tone: "sky", isAssembling: true, isStable: false },
  atlas: { label: "CREATING NEURAL LINKS", detail: "Linking traceable evidence into an investigation record.", tone: "violet", isAssembling: true, isStable: false },
  sentinel: { label: "GENOME STABLE", detail: "Living. Evidence verified and ready for bounded reasoning.", tone: "cyan", isAssembling: false, isStable: true },
  safe: { label: "EVIDENCE VERIFIED", detail: "Identity signals remain consistent with the available evidence.", tone: "sky", isAssembling: false, isStable: true },
  suspicious: { label: "EVIDENCE REVIEW", detail: "A forensic investigation requires careful evidence review.", tone: "amber", isAssembling: false, isStable: false },
  impersonation: { label: "HIGH-RISK SIGNAL", detail: "Evidence conflicts with the expected Identity Genome.", tone: "rose", isAssembling: false, isStable: false },
};

const toneClasses = {
  cyan: "text-cyan-200",
  sky: "text-sky-200",
  violet: "text-violet-200",
  amber: "text-amber-200",
  rose: "text-rose-200",
} as const;

export function IdentityGenomeHologram({ phase, identityLabel, trustRating, genomeVersion, confidence, status, currentState, compact = false, signals = [], activeSignalIds = [], sourceCount = 0, knowledgeObjectCount, lastSynchronized, onSignalFocus }: IdentityGenomeHologramProps) {
  const [coreActive, setCoreActive] = useState(false);
  const state = phaseStates[phase];
  const health = genomeHealth(signals);
  const totalEvidence = signals.reduce((total, signal) => total + signal.evidenceCount, 0);
  const updatedAt = lastSynchronized ?? signals.map((signal) => signal.lastUpdated).filter(Boolean).sort().at(-1);
  const orbitNodes = useMemo(() => buildGenomeOrbitNodes(signals, genomeVersion), [signals, genomeVersion]);
  const neuralLinks = orbitNodes.filter((node) => node.evidenceCount > 0).length;
  const resolvedKnowledgeObjects = knowledgeObjectCount ?? totalEvidence;
  const hasEvidence = totalEvidence > 0;
  const signalMetrics = useMemo(() => ({
    knowledgeObjects: resolvedKnowledgeObjects,
    evidenceSources: sourceCount,
    neuralLinks,
    confidence,
    twinStatus: status || "Genome active",
    lastSynchronized: updatedAt,
    stability: health,
    signalStrength: health,
  }), [confidence, health, neuralLinks, resolvedKnowledgeObjects, sourceCount, status, updatedAt]);

  return <section aria-label="Living Identity Genome" className={`genome-hologram-shell relative isolate overflow-hidden rounded-[2rem] border border-white/[.12] bg-[#060a1c]/90 p-4 shadow-[0_30px_100px_rgb(0_0_0_/_35%)] sm:p-5 ${compact ? "" : "min-h-[43rem]"}`}>
    <div aria-hidden="true" className="genome-depth-layer genome-depth-layer-one absolute inset-0" />
    <div aria-hidden="true" className="genome-depth-layer genome-depth-layer-two absolute inset-0" />
    <div aria-hidden="true" className="genome-neural-grid absolute inset-0" />
    <header className="relative z-30 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-mono text-[10px] font-medium tracking-[.2em] text-slate-500">LIVING IDENTITY GENOME</p>
        <h2 className="mt-1 text-base font-medium tracking-tight text-white">{identityLabel}</h2>
      </div>
      <div className={`inline-flex items-center gap-2 rounded-full border border-current/20 bg-current/[.07] px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[.13em] ${toneClasses[state.tone]}`}>
        {state.isStable ? <BadgeCheck aria-hidden="true" className="size-3" /> : <ScanLine aria-hidden="true" className="size-3" />}
        {state.label}
      </div>
    </header>

    <div className={`relative mt-4 flex min-h-[37rem] items-start justify-center overflow-hidden rounded-[1.5rem] border border-white/[.08] bg-[radial-gradient(circle_at_50%_44%,rgb(28_181_224_/_11%),transparent_38%),linear-gradient(145deg,rgb(13_21_50_/_72%),rgb(3_6_19_/_88%))] pt-8 md:min-h-[26rem] md:items-center md:pt-0 ${toneClasses[state.tone]}`}>
      <div aria-hidden="true" className="genome-ambient-particles absolute inset-0" />
      <div aria-hidden="true" className="genome-radial-motion absolute inset-0" />
      <GenomeOrbit signals={signals} activeSignalIds={activeSignalIds} genomeVersion={genomeVersion} onSignalFocus={onSignalFocus} isCoreActive={coreActive} />
      <LivingHologramCore assembly={state.isAssembling || !hasEvidence} active={coreActive} onInteractionChange={setCoreActive} />
      <div aria-hidden="true" className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[8px] tracking-[.15em] text-cyan-100/70"><CircleDot className={`size-3 ${state.isStable ? "genome-live-dot" : ""}`} />DNA SIGNAL · {state.isStable ? "LIVE" : "ASSEMBLING"}</div>
      <div aria-hidden="true" className="absolute right-4 top-4 rounded-full border border-white/[.1] bg-[#071024]/80 px-2.5 py-1 font-mono text-[8px] tracking-[.12em] text-slate-300">HEALTH {health}%</div>
    </div>

    <div className="relative z-30 mt-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="font-mono text-[9px] tracking-[.15em] text-slate-500">CURRENT STATE</p><p className="mt-1 text-sm font-medium text-slate-100">{currentState || state.detail}</p><p className="mt-1 text-xs leading-5 text-slate-500">{state.detail}</p></div>
      <div className="rounded-xl border border-white/[.09] bg-white/[.025] px-3 py-2 text-right"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">TRUST SIGNAL</p><p className="mt-1 font-mono text-xs font-medium text-cyan-100">{trustRating ?? (hasEvidence ? "Evidence-led" : "Assembling")}</p></div>
    </div>

    <div className="relative z-30 mt-4 grid grid-cols-2 gap-3 border-y border-white/[.08] py-4 sm:grid-cols-3">
      <GenomeSummary label="Genome version" value={genomeVersion ?? "Initial assembly"} />
      <GenomeSummary label="Evidence coverage" value={hasEvidence ? `${totalEvidence} signals linked` : "Ready for evidence"} />
      <GenomeSummary label="Status" value={status || (state.isStable ? "Evidence verified" : "Knowledge graph assembling")} />
    </div>
    <div className="mt-4"><GenomeSignalStrip metrics={signalMetrics} /></div>
  </section>;
}

function GenomeSummary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</p><p className="mt-1 truncate font-mono text-[11px] font-medium text-slate-200">{value}</p></div>;
}

export type { HologramPhase } from "@/components/identity-genome/types";
