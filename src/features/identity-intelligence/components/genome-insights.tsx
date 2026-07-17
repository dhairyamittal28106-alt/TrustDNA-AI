import { BellRing, Sparkles } from "lucide-react";
import { ProvenanceBadge } from "@/features/identity-intelligence/components/provenance-badge";
import type { GuardianInsight } from "@/features/identity-intelligence/types";

export function GenomeInsights({ insights }: { insights: GuardianInsight[] }) {
  return <section aria-labelledby="guardian-insights-heading" className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">GUARDIAN INTELLIGENCE</p><h2 id="guardian-insights-heading" className="mt-2 text-xl font-medium text-white">What your Guardian understands</h2><p className="mt-2 text-xs leading-5 text-slate-400">Insights are evidence-linked summaries, never black-box judgments.</p></div><BellRing aria-hidden="true" className="size-5 text-[#b6acff]" /></div>
    <ul className="mt-6 space-y-3">{insights.map((insight) => <li key={insight.id} className="rounded-xl border border-white/[.07] bg-black/10 p-4"><div className="flex items-start gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#8e7af6]/12 text-[#c4bcff]"><Sparkles aria-hidden="true" className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-100">{insight.title}</p><ProvenanceBadge origin={insight.origin} /></div><p className="mt-2 text-xs leading-5 text-slate-400">{insight.detail}</p>{insight.updatedAt && <time className="mt-2 block font-mono text-[9px] tracking-[.12em] text-slate-600" dateTime={insight.updatedAt}>{formatTimestamp(insight.updatedAt)}</time>}</div></div></li>)}</ul>
  </section>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
