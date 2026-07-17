import { CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import type { GenomeEvolutionState } from "@/features/identity-evolution/types";

const lifecycle = [
  { id: "analysis", label: "Identity analysis", detail: "Deterministic text analysis processes the consented source." },
  { id: "knowledge", label: "Knowledge extraction", detail: "Explainable communication and observed-vocabulary objects are rebuilt." },
  { id: "merge", label: "Genome merge", detail: "The backend returns the current/latest text-feature snapshot." },
  { id: "version", label: "Version creation", detail: "A backend-recorded Genome version becomes the comparison boundary." },
  { id: "guardian", label: "Guardian update", detail: "A deterministic observation summarizes the recorded diff." },
  { id: "twin", label: "Twin refresh", detail: "The Twin receives a Genome-version refresh signal." },
] as const;

export function EvolutionLifecycle({ busy, evolution }: { busy: boolean; evolution: GenomeEvolutionState }) {
  const hasVersion = Boolean(evolution.latest);
  return <section aria-labelledby="evolution-lifecycle-heading" className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">CONTINUOUS LEARNING</p><h2 id="evolution-lifecycle-heading" className="mt-2 text-xl font-medium text-white">Genome update lifecycle</h2><p className="mt-2 text-xs leading-5 text-slate-400">This records the actual deterministic path after a supported source is submitted—without simulating connectors or hidden reasoning.</p></div><RefreshCw aria-hidden="true" className={`size-5 text-[#b6acff] ${busy ? "animate-spin" : ""}`} /></div><ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{lifecycle.map((step, index) => { const active = busy && index === 0; const complete = !busy && hasVersion; return <li key={step.id} className={`rounded-xl border p-3 ${active ? "border-[#b8adff]/30 bg-[#8d79f7]/[.08]" : complete ? "border-cyan-300/12 bg-cyan-300/[.035]" : "border-white/[.06] bg-black/[.08]"}`}><div className="flex items-center gap-2">{active ? <CircleDashed aria-hidden="true" className="size-3.5 animate-spin text-[#c7c0ff]" /> : complete ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" /> : <span aria-hidden="true" className="size-3.5 rounded-full border border-slate-600" />}<p className="text-xs font-medium text-slate-200">{step.label}</p></div><p className="mt-2 text-[11px] leading-4 text-slate-500">{step.detail}</p></li>;})}</ol>{evolution.latest && !busy && <p role="status" className="mt-4 rounded-xl border border-cyan-300/12 bg-cyan-300/[.04] px-3 py-2 text-xs text-cyan-100">Genome {evolution.latest.version.version} is the current version for new Twin responses.</p>}</section>;
}
