import { Fingerprint, Layers3, Sparkles } from "lucide-react";
import type { BehaviorPattern, IdentityDimension, IdentityDimensionId, IdentityProfile } from "@/features/identity-reasoning/types";

type IdentityProfilePanelProps = {
  profile: IdentityProfile;
  usedDimensionIds: IdentityDimensionId[];
  usedBehaviorIds: string[];
};

const profileCards: Array<{ id: IdentityDimensionId | "behavior"; label: string; unavailable: string }> = [
  { id: "goals", label: "Goals", unavailable: "Awaiting an explicit goal statement." },
  { id: "projects", label: "Projects", unavailable: "Awaiting a direct project statement." },
  { id: "career", label: "Career", unavailable: "Awaiting an explicit career-direction statement." },
  { id: "values", label: "Values", unavailable: "Awaiting explicit value language in consented evidence." },
  { id: "behavior", label: "Behavior", unavailable: "Behavior signals require repeated direct evidence." },
  { id: "strengths", label: "Strengths", unavailable: "Awaiting project, skills, framework, or communication evidence." },
  { id: "weaknesses", label: "Weaknesses", unavailable: "TrustDNA does not infer weaknesses without explicit evidence." },
  { id: "motivations", label: "Motivations", unavailable: "Awaiting an explicit dream, goal, or career aim." },
  { id: "risk_tolerance", label: "Risk preference", unavailable: "Awaiting repeated direct statements about risk or uncertainty." },
  { id: "decision_style", label: "Decision style", unavailable: "Awaiting repeated direct decision-language evidence." },
];

/** A transparent overview of all current Identity Profile dimensions and intentional evidence gaps. */
export function IdentityProfilePanel({ profile, usedDimensionIds, usedBehaviorIds }: IdentityProfilePanelProps) {
  return <section aria-labelledby="identity-profile-heading" className="glass rounded-[1.7rem] border border-white/[.1] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="rounded-xl border border-[#a99bff]/18 bg-[#8d79f7]/[.09] p-2"><Fingerprint aria-hidden="true" className="size-4 text-[#c5beff]" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#bdb5ff]">UNIFIED IDENTITY PROFILE</p><h3 id="identity-profile-heading" className="mt-1 text-base font-medium text-white">Multi-dimensional evidence profile</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Synthesized from direct Identity Knowledge and measured text evidence. Empty cards are evidence boundaries, not negative claims.</p></div></div><div className="rounded-xl border border-white/[.08] bg-black/[.12] px-3 py-2"><p className="font-mono text-[8px] tracking-[.1em] text-slate-600">PROFILE COVERAGE</p><p className="mt-1 text-xs font-medium text-slate-200">{profile.dimensions.length} dimensions · {profile.sourceCount} source{profile.sourceCount === 1 ? "" : "s"}</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{profileCards.map((card) => <ProfileCard key={card.id} card={card} dimension={card.id === "behavior" ? undefined : profile.dimensions.find((item) => item.id === card.id)} signals={card.id === "behavior" ? profile.behaviorSignals : []} used={card.id === "behavior" ? profile.behaviorSignals.some((signal) => usedBehaviorIds.includes(signal.id)) : usedDimensionIds.includes(card.id)} />)}</div></section>;
}

function ProfileCard({ card, dimension, signals, used }: { card: typeof profileCards[number]; dimension?: IdentityDimension; signals: BehaviorPattern[]; used: boolean }) {
  const visibleSignals = signals.slice(0, 2);
  const hasEvidence = Boolean(dimension) || visibleSignals.length > 0;
  const confidence = dimension?.confidence ?? (visibleSignals.length ? Math.max(...visibleSignals.map((signal) => signal.confidence)) : null);
  const value = dimension?.value ?? visibleSignals.map((signal) => signal.label).join(" · ");
  const evidence = dimension?.evidence ?? visibleSignals.map((signal) => signal.evidence).join(" ");
  const source = dimension?.source ?? (visibleSignals.length ? Array.from(new Set(visibleSignals.map((signal) => signal.source))).join(", ") : undefined);
  const newestSignal = [...visibleSignals].sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
  const version = dimension?.version ?? newestSignal?.version;
  const timestamp = dimension?.timestamp ?? newestSignal?.timestamp;

  return <article className={`min-h-52 rounded-2xl border p-4 ${hasEvidence ? used ? "border-cyan-300/20 bg-cyan-300/[.05]" : "border-white/[.08] bg-black/[.12]" : "border-dashed border-white/[.1] bg-black/[.08]"}`}><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-100">{card.label}</p>{hasEvidence ? <span className="inline-flex items-center gap-1 font-mono text-[8px] tracking-[.08em] text-cyan-100">{used && <Sparkles aria-hidden="true" className="size-3" />}{confidence === null ? "EVIDENCE" : `${Math.round(confidence * 100)}%`}</span> : <span className="font-mono text-[8px] tracking-[.08em] text-slate-600">PENDING</span>}</div>{hasEvidence ? <><p className="mt-3 text-xs leading-5 text-slate-300">{value}</p><p className="mt-3 line-clamp-3 text-[10px] leading-4 text-slate-500">{evidence}</p><div className="mt-4 border-t border-white/[.07] pt-3"><p className="text-[10px] leading-4 text-slate-500">{source}</p>{version && <p className="mt-1 font-mono text-[8px] tracking-[.07em] text-slate-600">{version} · {formatTimestamp(timestamp)}</p>}</div></> : <div className="mt-4 rounded-xl border border-white/[.06] bg-black/[.12] p-3"><Layers3 aria-hidden="true" className="size-3.5 text-slate-600" /><p className="mt-2 text-[10px] leading-4 text-slate-600">{card.unavailable}</p></div>}</article>;
}

function formatTimestamp(value: string | undefined): string {
  if (!value) return "Current profile";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
