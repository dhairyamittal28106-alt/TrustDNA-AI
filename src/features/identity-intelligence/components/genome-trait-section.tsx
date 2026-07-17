import { ChevronDown, Clock3, Database, ShieldCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ProvenanceBadge } from "@/features/identity-intelligence/components/provenance-badge";
import type { GenomeSection } from "@/features/identity-intelligence/types";

export function GenomeTraitSection({ section, defaultOpen = false }: { section: GenomeSection; defaultOpen?: boolean }) {
  const confidence = section.genomeConfidence;
  return (
    <details open={defaultOpen} className="glass group rounded-2xl border border-white/[.09]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c8dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07091b]">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-medium text-white">{section.title}</h3><ProvenanceBadge origin={section.origin} /></div><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">{section.description}</p></div>
        <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-slate-500 transition duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/[.07] px-5 pb-5 pt-4">
        <div className="grid gap-3 text-xs sm:grid-cols-3"><Meta icon={ShieldCheck} label="Confidence" value={confidence === undefined ? "Awaiting evidence" : `${confidence}% genome-level`} /><Meta icon={Database} label="Evidence sources" value={section.evidenceSources.length ? `${section.evidenceSources.length} connected` : "None yet"} /><Meta icon={Clock3} label="Last updated" value={section.lastUpdated ? formatTimestamp(section.lastUpdated) : "—"} /></div>
        {confidence !== undefined && <div className="mt-4"><div className="mb-2 flex items-center justify-between font-mono text-[9px] tracking-[.12em] text-slate-500"><span>GENOME-LEVEL CONFIDENCE</span><span>{confidence}%</span></div><Progress value={confidence} className="bg-white/[.08] [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-[#8d79f7] [&>[data-slot=progress-indicator]]:to-cyan-300" /></div>}
        {section.traits.length ? <ul className="mt-5 grid gap-3 md:grid-cols-2">{section.traits.map((trait) => <li key={trait.id} className="rounded-xl border border-white/[.07] bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-slate-100">{trait.title}</p><ProvenanceBadge origin={trait.origin} /></div><p className="mt-3 font-mono text-xs text-[#c3bbff]">{trait.value}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{trait.description}</p></li>)}</ul> : <EmptySection message={section.emptyMessage ?? "No explainable evidence is available for this category yet."} />}
      </div>
    </details>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[.06] bg-black/10 px-3 py-2.5"><Icon aria-hidden="true" className="size-3.5 shrink-0 text-[#b9afff]" /><div className="min-w-0"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</p><p className="mt-0.5 truncate text-[11px] text-slate-300">{value}</p></div></div>;
}

function EmptySection({ message }: { message: string }) {
  return <div className="mt-5 rounded-xl border border-dashed border-white/[.1] bg-black/10 p-4 text-xs leading-5 text-slate-500">{message}</div>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
