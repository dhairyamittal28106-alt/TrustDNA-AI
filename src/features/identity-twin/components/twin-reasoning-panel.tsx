"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, CheckCircle2, CircleDashed, Lightbulb, ScanSearch, ShieldCheck } from "lucide-react";
import { IdentityGenomeHologram, type HologramPhase } from "@/components/identity-genome-hologram";
import { buildGenomeHologramSignals } from "@/features/identity-intelligence/hologram-signals";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinGuardianState, TwinPipelineStage, TwinResponse } from "@/features/identity-twin/types";

type TwinReasoningPanelProps = {
  response?: TwinResponse;
  snapshot: GenomeSnapshot;
  guardianState: TwinGuardianState;
  activePipelineStage: number;
  isProcessing: boolean;
  identityLabel: string;
};

const guardianCopy: Record<TwinGuardianState, { label: string; detail: string; phase: HologramPhase }> = {
  listening: { label: "LISTENING", detail: "Guardian is ready for an evidence-bound question.", phase: "idle" },
  thinking: { label: "THINKING", detail: "Guardian is identifying the allowed evidence scope.", phase: "genome_creation" },
  reasoning: { label: "REASONING", detail: "Guardian is correlating deterministic knowledge objects.", phase: "sentinel" },
  answer_ready: { label: "ANSWER READY", detail: "Guardian assembled an answer with its evidence boundary visible.", phase: "sentinel" },
};

export function TwinReasoningPanel({ response, snapshot, guardianState, activePipelineStage, isProcessing, identityLabel }: TwinReasoningPanelProps) {
  const reduceMotion = useReducedMotion();
  const guardian = guardianCopy[guardianState];
  const stages = response?.pipeline ?? initialPipeline;
  const signals = buildGenomeHologramSignals(snapshot);
  const activeSignalIds = Array.from(new Set([
    ...(response?.identityReasoning?.dimensions.map((dimension) => dimension.id) ?? []),
    ...(response?.evidenceUsed.map((evidence) => evidence.category) ?? []),
  ]));

  function focusEvidence() {
    document.getElementById("twin-evidence-heading")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return <section aria-labelledby="twin-reasoning-heading" className="space-y-5"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .35 }}><IdentityGenomeHologram compact phase={guardian.phase} identityLabel={identityLabel} trustRating="Evidence-led" genomeVersion={snapshot.latestVersion?.version} confidence={snapshot.genomeConfidence} status={guardian.label} currentState={guardian.detail} signals={signals} activeSignalIds={activeSignalIds} onSignalFocus={focusEvidence} /></motion.div><div className="glass rounded-[1.5rem] border border-white/[.1] p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">TWIN REASONING</p><h2 id="twin-reasoning-heading" className="mt-1 text-base font-medium text-white">Evidence trace</h2></div><span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9afff]/20 bg-[#8d79f7]/[.08] px-2 py-1 font-mono text-[8px] tracking-[.12em] text-[#d1cbff]"><BrainCircuit aria-hidden="true" className="size-3" />{guardian.label}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">A structured trace of what the Twin can use—not hidden chain-of-thought.</p><ol className="mt-5 space-y-3" aria-label="Identity Twin processing pipeline">{stages.map((stage, index) => <PipelineStage key={stage.id} stage={resolveStage(stage, index, activePipelineStage, isProcessing)} index={index} />)}</ol></div><div className="glass rounded-[1.5rem] border border-white/[.1] p-5"><div className="flex items-center gap-2"><ScanSearch aria-hidden="true" className="size-4 text-cyan-200" /><h3 className="text-sm font-medium text-white">Reasoning summary</h3></div>{response ? <ul className="mt-4 space-y-2.5">{response.reasoningSummary.map((summary) => <li key={summary} className="flex gap-2 text-xs leading-5 text-slate-400"><span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-[#bdb4ff]" />{summary}</li>)}</ul> : <p className="mt-3 text-xs leading-5 text-slate-500">Ask a question to see the selected evidence path and its limitations.</p>}{response && <div className="mt-5 rounded-xl border border-white/[.07] bg-black/[.14] p-3"><p className="font-mono text-[9px] tracking-[.13em] text-slate-600">RESPONSE CONFIDENCE</p><p className="mt-1 text-xl font-semibold text-white">{response.confidenceLabel}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{response.hybridAdvice ? response.confidence === null ? "No direct Identity Evidence was selected; the guidance is visibly marked as general." : "Measures Identity Evidence coverage only; it does not score general advice." : response.confidence === null ? "Unknown without directly relevant evidence." : "Uses the current Genome’s deterministic coverage heuristic."}</p></div>}</div>{response?.limitations.length ? <div className="rounded-[1.5rem] border border-amber-300/15 bg-amber-300/[.05] p-5"><div className="flex items-center gap-2 text-amber-100"><Lightbulb aria-hidden="true" className="size-4 text-amber-200" /><h3 className="text-sm font-medium">Evidence boundary</h3></div><ul className="mt-3 space-y-2">{response.limitations.map((limitation) => <li key={limitation} className="text-xs leading-5 text-amber-50/75">{limitation}</li>)}</ul></div> : <div className="rounded-[1.5rem] border border-cyan-300/12 bg-cyan-300/[.04] p-5 text-xs leading-5 text-slate-400"><ShieldCheck aria-hidden="true" className="mb-2 size-4 text-cyan-200" />The Twin has no private memory layer. Its response starts and ends with the loaded Identity Genome.</div>}</section>;
}

const initialPipeline: TwinPipelineStage[] = [
  { id: "question", label: "Question received", detail: "Waiting for a question.", status: "pending" },
  { id: "intent", label: "Intent detection", detail: "Maps a question to an allowed evidence scope.", status: "pending" },
  { id: "genome", label: "Genome retrieval", detail: "Scopes the current versioned Identity Genome.", status: "pending" },
  { id: "evidence", label: "Evidence selection", detail: "Retains only explainable evidence objects.", status: "pending" },
  { id: "knowledge", label: "Knowledge correlation", detail: "Keeps knowledge objects structured and traceable.", status: "pending" },
  { id: "reasoning", label: "Reasoning Graph construction", detail: "Connects only selected evidence and deterministic signals.", status: "pending" },
  { id: "decision", label: "Decision Engine", detail: "Keeps the recommendation bounded by supporting and missing evidence.", status: "pending" },
  { id: "confidence", label: "Confidence estimation", detail: "Measures evidence relevance and coverage, not certainty about the future.", status: "pending" },
  { id: "answer", label: "Response assembly", detail: "Shows answer, confidence, evidence, and limitations.", status: "pending" },
];

function resolveStage(stage: TwinPipelineStage, index: number, activePipelineStage: number, isProcessing: boolean): TwinPipelineStage {
  if (!isProcessing) return stage;
  if (index < activePipelineStage) return { ...stage, status: "complete" };
  if (index === activePipelineStage) return { ...stage, status: "active" };
  return { ...stage, status: "pending" };
}

function PipelineStage({ stage, index }: { stage: TwinPipelineStage; index: number }) {
  const complete = stage.status === "complete";
  const active = stage.status === "active";
  return <li className="relative flex gap-3"><div className="relative flex w-5 shrink-0 justify-center">{index > 0 && <span aria-hidden="true" className={`absolute bottom-1/2 top-[-1.15rem] w-px ${complete || active ? "bg-[#9b8bfd]/55" : "bg-white/[.08]"}`} />}{complete ? <CheckCircle2 aria-hidden="true" className="relative z-[1] mt-0.5 size-4 rounded-full bg-[#0a0c21] text-cyan-300" /> : <CircleDashed aria-hidden="true" className={`relative z-[1] mt-0.5 size-4 rounded-full bg-[#0a0c21] ${active ? "animate-spin text-[#c0b7ff]" : "text-slate-600"}`} />}</div><div className="pb-1"><p className={`text-xs font-medium ${complete ? "text-slate-100" : active ? "text-[#d0caff]" : "text-slate-500"}`}>{stage.label}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{stage.detail}</p></div></li>;
}
