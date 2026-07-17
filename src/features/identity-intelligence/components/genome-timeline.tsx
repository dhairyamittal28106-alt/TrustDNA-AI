import { Clock3, GitCommitHorizontal } from "lucide-react";
import { ProvenanceBadge } from "@/features/identity-intelligence/components/provenance-badge";
import type { GenomeTimelineEvent } from "@/features/identity-intelligence/types";

export function GenomeTimeline({ events }: { events: GenomeTimelineEvent[] }) {
  return <section aria-labelledby="genome-timeline-heading" className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">GENOME VERSIONING</p><h2 id="genome-timeline-heading" className="mt-2 text-xl font-medium text-white">Identity Timeline</h2><p className="mt-2 text-xs leading-5 text-slate-400">Every recorded version remains linked to the evidence that created it.</p></div><Clock3 aria-hidden="true" className="size-5 text-[#b6acff]" /></div>
    {events.length ? <ol className="mt-6 space-y-4">{events.map((event, index) => <li key={event.id} className="relative flex gap-3"><div aria-hidden="true" className="flex w-5 shrink-0 flex-col items-center"><span className="mt-0.5 grid size-5 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-cyan-200"><GitCommitHorizontal className="size-3" /></span>{index < events.length - 1 && <span className="mt-1 w-px flex-1 bg-gradient-to-b from-cyan-300/35 to-transparent" />}</div><div className="min-w-0 pb-3"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-100">{event.title}</p><ProvenanceBadge origin={event.origin} /></div><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>{event.timestamp && <time className="mt-2 block font-mono text-[9px] tracking-[.12em] text-slate-600" dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>}</div></li>)}</ol> : <div className="mt-6 rounded-xl border border-dashed border-white/[.1] bg-black/10 p-5 text-center"><Clock3 aria-hidden="true" className="mx-auto size-5 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">Your timeline is waiting for evidence.</p><p className="mt-1 text-xs leading-5 text-slate-500">Analyze a supported text source to record the first version of your Identity Genome.</p></div>}
  </section>;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
