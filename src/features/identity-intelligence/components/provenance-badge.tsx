import { CheckCircle2, Clock3, Eye } from "lucide-react";
import type { KnowledgeOrigin } from "@/features/identity-intelligence/types";

const styles: Record<KnowledgeOrigin, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  extracted: { label: "Extracted", className: "border-cyan-300/20 bg-cyan-300/[.08] text-cyan-100", icon: CheckCircle2 },
  derived: { label: "Derived", className: "border-violet-300/20 bg-violet-300/[.08] text-violet-100", icon: Eye },
  awaiting_evidence: { label: "Awaiting evidence", className: "border-white/[.1] bg-white/[.035] text-slate-400", icon: Clock3 },
  preview: { label: "Preview", className: "border-amber-300/20 bg-amber-300/[.07] text-amber-100", icon: Eye },
};

export function ProvenanceBadge({ origin }: { origin: KnowledgeOrigin }) {
  const state = styles[origin];
  const Icon = state.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[8px] font-medium tracking-[.12em] ${state.className}`}><Icon aria-hidden="true" className="size-3" />{state.label.toUpperCase()}</span>;
}
