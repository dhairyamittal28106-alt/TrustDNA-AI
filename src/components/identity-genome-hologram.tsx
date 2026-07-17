"use client";

import { useId } from "react";

type HologramPhase =
  | "idle"
  | "genome_creation"
  | "genesis"
  | "cipher"
  | "chronos"
  | "forensiq"
  | "spectra"
  | "atlas"
  | "sentinel"
  | "safe"
  | "suspicious"
  | "impersonation";

type IdentityGenomeHologramProps = {
  phase: HologramPhase;
  identityLabel: string;
  trustRating?: string;
  genomeVersion?: string;
  confidence?: number;
  status: string;
  currentState: string;
  compact?: boolean;
};

const phaseStyles: Record<HologramPhase, { color: string; glow: string; phaseLabel: string; detail: string }> = {
  idle: { color: "text-cyan-300", glow: "bg-cyan-400/15", phaseLabel: "STANDBY", detail: "Identity signal ready" },
  genome_creation: { color: "text-sky-300", glow: "bg-sky-400/20", phaseLabel: "GENOME ASSEMBLY", detail: "Mapping digital identity signals" },
  genesis: { color: "text-blue-300", glow: "bg-blue-400/20", phaseLabel: "GENESIS ACTIVE", detail: "Reconstructing Identity Genome" },
  cipher: { color: "text-cyan-200", glow: "bg-cyan-300/20", phaseLabel: "CIPHER ACTIVE", detail: "Comparing communication signature" },
  chronos: { color: "text-violet-300", glow: "bg-violet-400/20", phaseLabel: "CHRONOS ACTIVE", detail: "Correlating temporal evidence" },
  forensiq: { color: "text-indigo-300", glow: "bg-indigo-400/20", phaseLabel: "FORENSIQ ACTIVE", detail: "Inspecting deterministic features" },
  spectra: { color: "text-sky-200", glow: "bg-sky-300/20", phaseLabel: "SPECTRA ACTIVE", detail: "Scanning artifact signal layer" },
  atlas: { color: "text-purple-300", glow: "bg-purple-400/20", phaseLabel: "ATLAS ACTIVE", detail: "Assembling evidence record" },
  sentinel: { color: "text-cyan-300", glow: "bg-cyan-400/15", phaseLabel: "SENTINEL MONITORING", detail: "Orchestrating investigation state" },
  safe: { color: "text-sky-200", glow: "bg-sky-300/25", phaseLabel: "VERDICT: SAFE", detail: "Identity signals remain consistent" },
  suspicious: { color: "text-amber-300", glow: "bg-amber-400/20", phaseLabel: "VERDICT: SUSPICIOUS", detail: "Evidence requires careful review" },
  impersonation: { color: "text-rose-300", glow: "bg-rose-400/25", phaseLabel: "VERDICT: HIGH RISK", detail: "Identity signals conflict with evidence" },
};

const particles = [[104, 96, 2], [65, 166, 1.6], [105, 252, 1.4], [356, 105, 1.7], [400, 183, 1.5], [370, 284, 2], [92, 352, 1.8], [330, 371, 1.3], [154, 420, 1.5], [310, 443, 1.5]] as const;
const dataNodes = [[137, 170], [324, 194], [116, 290], [353, 312], [180, 382], [290, 386]] as const;

export function IdentityGenomeHologram({ phase, identityLabel, trustRating, genomeVersion, confidence, status, currentState, compact = false }: IdentityGenomeHologramProps) {
  const instanceId = useId().replace(/:/g, "");
  const titleId = `${instanceId}-identity-genome-title`;
  const bodyGradientId = `${instanceId}-hologram-body`;
  const edgeGradientId = `${instanceId}-hologram-edge`;
  const bloomFilterId = `${instanceId}-hologram-bloom`;
  const figureClipId = `${instanceId}-hologram-figure-clip`;
  const state = phaseStyles[phase];
  const hasInvestigationEffects = !["idle", "genome_creation", "safe", "suspicious", "impersonation"].includes(phase);
  const showOrbitNodes = phase === "forensiq" || phase === "sentinel";
  const showTimeline = phase === "chronos";
  const showScan = phase === "genome_creation" || phase === "spectra";
  const showEvidenceCards = phase === "atlas";
  const showCipherEyes = phase === "cipher";
  const showGlitch = phase === "impersonation";

  return (
    <section aria-labelledby={titleId} className={`glass relative overflow-hidden rounded-[1.75rem] border border-white/[.12] p-4 shadow-2xl shadow-black/30 ${compact ? "" : "mx-auto max-w-md"}`}>
      <div aria-hidden="true" className={`absolute -right-14 -top-16 size-48 rounded-full blur-3xl ${state.glow}`} />
      <div aria-hidden="true" className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div><p className="font-mono text-[10px] font-medium tracking-[.18em] text-slate-500">IDENTITY GENOME</p><h2 id={titleId} className="mt-1 text-sm font-medium text-white">{identityLabel}</h2></div>
        <div className={`flex items-center gap-1.5 rounded-full border border-current/20 bg-current/[.07] px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[.13em] ${state.color}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_9px_currentColor]" />{state.phaseLabel}</div>
      </div>
      <div className={`relative mt-3 aspect-[1.04] overflow-hidden rounded-2xl border border-white/[.07] bg-[#050a20]/80 ${state.color}`} role="img" aria-label={`Abstract holographic Identity Genome. ${state.detail}.`}>
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,currentColor,transparent_47%)] opacity-[.09]" />
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 460 480" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={bodyGradientId} x1="230" y1="82" x2="230" y2="432" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".4" /><stop offset=".48" stopColor="currentColor" stopOpacity=".13" /><stop offset="1" stopColor="currentColor" stopOpacity=".03" /></linearGradient>
            <linearGradient id={edgeGradientId} x1="120" y1="116" x2="350" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="currentColor" stopOpacity=".95" /><stop offset=".52" stopColor="#dffbff" stopOpacity=".75" /><stop offset="1" stopColor="currentColor" stopOpacity=".15" /></linearGradient>
            <filter id={bloomFilterId} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <clipPath id={figureClipId}><path d="M230 72C181 72 158 112 158 154C158 181 172 205 191 219L175 263C134 286 112 335 106 420H354C348 335 326 286 285 263L269 219C288 205 302 181 302 154C302 112 279 72 230 72Z" /></clipPath>
          </defs>
          <g className="hologram-ring hologram-ring-slow" opacity=".62"><ellipse cx="230" cy="246" rx="174" ry="60" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 12" /><ellipse cx="230" cy="246" rx="122" ry="40" stroke="currentColor" strokeWidth=".85" strokeDasharray="2 8" opacity=".55" /></g>
          {showTimeline && <g className="hologram-ring hologram-ring-reverse" opacity=".9"><circle cx="230" cy="235" r="159" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 10" /><path d="M230 71V399M72 235H388" stroke="currentColor" strokeWidth=".75" strokeDasharray="3 8" opacity=".55" /></g>}
          <g className="hologram-float">
            <path d="M230 72C181 72 158 112 158 154C158 181 172 205 191 219L175 263C134 286 112 335 106 420H354C348 335 326 286 285 263L269 219C288 205 302 181 302 154C302 112 279 72 230 72Z" fill={`url(#${bodyGradientId})`} stroke={`url(#${edgeGradientId})`} strokeWidth="1.5" filter={`url(#${bloomFilterId})`} />
            <g clipPath={`url(#${figureClipId})`} opacity=".68">{[118, 142, 166, 190, 214, 238, 262, 286, 310, 334, 358, 382, 406].map((y) => <path key={y} d={`M104 ${y}H356`} stroke="currentColor" strokeWidth=".7" opacity=".52" />)}<path d="M159 154H301M180 205H280M175 264H285M141 314H319M118 368H342" stroke="currentColor" strokeWidth=".85" opacity=".5" /><path d="M230 77V414M184 119L276 119M164 169L296 169M156 322L304 322" stroke="currentColor" strokeWidth=".75" strokeDasharray="3 5" opacity=".65" /></g>
            <path d="M191 219C211 232 249 232 269 219M175 263C202 282 258 282 285 263M140 368C194 388 266 388 320 368" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 6" opacity=".7" />
            <circle cx="195" cy="155" r={showCipherEyes ? "5" : "2.5"} fill="currentColor" className={showCipherEyes ? "hologram-eye-pulse" : ""} /><circle cx="265" cy="155" r={showCipherEyes ? "5" : "2.5"} fill="currentColor" className={showCipherEyes ? "hologram-eye-pulse" : ""} />
          </g>
          {showScan && <g clipPath={`url(#${figureClipId})`} className="hologram-scan"><rect x="117" y="-84" width="226" height="74" fill="currentColor" opacity=".1" /><path d="M117 0H343" stroke="currentColor" strokeWidth="1.5" opacity=".9" /></g>}
          {showOrbitNodes && <g className="hologram-orbit" opacity=".85">{dataNodes.map(([cx, cy]) => <g key={`${cx}-${cy}`}><circle cx={cx} cy={cy} r="4" fill="currentColor" /><circle cx={cx} cy={cy} r="8" stroke="currentColor" strokeWidth=".7" opacity=".55" /></g>)}</g>}
          {showEvidenceCards && <g className="hologram-evidence" opacity=".82"><rect x="68" y="128" width="73" height="35" rx="5" stroke="currentColor" strokeWidth="1" /><path d="M79 139H127M79 149H113" stroke="currentColor" strokeWidth="1" /><rect x="320" y="268" width="75" height="35" rx="5" stroke="currentColor" strokeWidth="1" /><path d="M332 279H382M332 289H365" stroke="currentColor" strokeWidth="1" /></g>}
          {particles.map(([cx, cy, r], index) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" opacity={0.28 + (index % 3) * 0.16} className="hologram-particle" style={{ animationDelay: `${index * -0.42}s` }} />)}
          {hasInvestigationEffects && <path d="M55 440H405" stroke="currentColor" strokeWidth="1" strokeDasharray="2 7" opacity=".7" />}
          {showGlitch && <g className="hologram-glitch" opacity=".55"><path d="M166 113H294M133 268H212M253 302H337M150 371H314" stroke="currentColor" strokeWidth="5" /><path d="M180 193H301M107 339H192" stroke="#b9fbff" strokeWidth="1.5" /></g>}
        </svg>
        <div aria-hidden="true" className="hologram-reflection absolute inset-x-6 bottom-3 h-8 rounded-[100%] bg-current/10 blur-md" />
        <div aria-hidden="true" className="absolute inset-x-4 bottom-4 flex items-center justify-between font-mono text-[8px] tracking-[.14em] text-current/60"><span>DNA.SIGNAL</span><span>LIVE</span></div>
      </div>
      <p className="relative mt-3 text-xs leading-5 text-slate-400">{state.detail}</p>
      <dl className="relative mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-white/[.07] bg-black/10 p-3"><GenomeMetric label="Trust rating" value={trustRating ?? "Pending"} /><GenomeMetric label="Genome version" value={genomeVersion ?? "—"} /><GenomeMetric label="Confidence" value={confidence === undefined ? "Pending" : `${confidence.toFixed(1)}%`} /><GenomeMetric label="Status" value={status} /></dl>
      <div className="relative mt-3 border-t border-white/[.07] pt-3"><p className="font-mono text-[9px] tracking-[.13em] text-slate-500">CURRENT INVESTIGATION STATE</p><p className="mt-1 text-xs font-medium text-slate-200">{currentState}</p></div>
    </section>
  );
}

function GenomeMetric({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-0.5 truncate font-mono text-[11px] font-medium text-slate-200">{value}</dd></div>;
}

export type { HologramPhase };
