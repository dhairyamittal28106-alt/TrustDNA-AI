"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import type { IdentityFeatures } from "@/features/identity-intelligence/types";

type SkillRadarProps = {
  features?: IdentityFeatures;
};

type WritingSignal = {
  label: string;
  normalized: number;
  value: string;
  detail: string;
};

const radarSize = 320;
const radarCenter = radarSize / 2;
const radarRadius = 102;

function clamp(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function nonNegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function percentage(value: number) {
  return `${(clamp(value) * 100).toFixed(1)}%`;
}

function punctuationKinds(features: IdentityFeatures) {
  return Object.values(features.punctuation_habits).filter((count) => Number.isFinite(count) && count > 0).length;
}

function writingSignals(features: IdentityFeatures): WritingSignal[] {
  const punctuationCount = punctuationKinds(features);

  return [
    {
      label: "Vocabulary richness",
      normalized: clamp(features.vocabulary_richness),
      value: percentage(features.vocabulary_richness),
      detail: "Unique-token ratio from analyzed text",
    },
    {
      label: "Professional-tone signal",
      normalized: clamp(features.professional_tone),
      value: percentage(features.professional_tone),
      detail: "Deterministic text-extractor measurement",
    },
    {
      label: "Sentence length",
      normalized: clamp(features.average_sentence_length / 35),
      value: `${nonNegative(features.average_sentence_length).toFixed(1)} words`,
      detail: "Radar scale caps at 35 words per sentence",
    },
    {
      label: "Response length",
      normalized: clamp(features.average_response_length / 250),
      value: `${nonNegative(features.average_response_length).toFixed(0)} words`,
      detail: "Radar scale caps at 250 words per response",
    },
    {
      label: "Punctuation variety",
      normalized: clamp(punctuationCount / 6),
      value: `${punctuationCount} mark${punctuationCount === 1 ? "" : "s"} observed`,
      detail: "Distinct tracked punctuation marks; radar caps at 6",
    },
    {
      label: "Emoji-frequency signal",
      normalized: clamp(features.emoji_frequency),
      value: percentage(features.emoji_frequency),
      detail: "Observed character-frequency measurement",
    },
  ];
}

function polarPoint(index: number, total: number, value: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  const radius = radarRadius * value;
  return {
    x: radarCenter + Math.cos(angle) * radius,
    y: radarCenter + Math.sin(angle) * radius,
  };
}

function polygonPoints(signals: WritingSignal[], scale: number) {
  return signals.map((signal, index) => {
    const point = polarPoint(index, signals.length, signal.normalized * scale);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function labelPoint(index: number, total: number): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  const point = polarPoint(index, total, 1.24);
  const anchor = Math.abs(point.x - radarCenter) < 8 ? "middle" : point.x > radarCenter ? "start" : "end";
  return { ...point, anchor };
}

export function SkillRadar({ features }: SkillRadarProps) {
  const reduceMotion = useReducedMotion();
  const instanceId = useId().replace(/:/g, "");
  const titleId = `${instanceId}-writing-signal-radar-title`;
  const fillGradientId = `${instanceId}-writing-signal-fill`;
  const edgeGradientId = `${instanceId}-writing-signal-edge`;
  const signals = features ? writingSignals(features) : [];

  if (!features) {
    return (
      <section aria-labelledby={titleId} className="glass relative overflow-hidden rounded-[1.65rem] border border-white/[.1] p-5 shadow-2xl shadow-black/20 sm:p-6">
        <div aria-hidden="true" className="absolute -right-24 -top-20 size-52 rounded-full bg-violet-400/10 blur-3xl" />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="relative"
        >
          <p className="font-mono text-[10px] font-medium tracking-[.18em] text-violet-200/75">IDENTITY INTELLIGENCE</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h3 id={titleId} className="text-lg font-medium tracking-tight text-white">Skill Radar</h3>
            <span className="rounded-full border border-slate-300/15 bg-slate-300/[.06] px-3 py-1.5 font-mono text-[10px] font-medium tracking-[.13em] text-slate-300">AWAITING VERIFIED EVIDENCE</span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Skills are intentionally not inferred from identity data. Analyze a supported writing source to unlock a clearly labeled writing-signal view.</p>

          <div className="relative mt-6 grid min-h-72 place-items-center overflow-hidden rounded-2xl border border-dashed border-white/[.12] bg-[#060a20]/65 px-6 text-center">
            <svg aria-hidden="true" className="absolute size-64 text-slate-500/35" viewBox={`0 0 ${radarSize} ${radarSize}`} fill="none" xmlns="http://www.w3.org/2000/svg">
              {[0.34, 0.67, 1].map((scale) => <polygon key={scale} points={Array.from({ length: 6 }, (_, index) => { const point = polarPoint(index, 6, scale); return `${point.x},${point.y}`; }).join(" ")} stroke="currentColor" strokeDasharray="3 6" strokeWidth="1" />)}
              {Array.from({ length: 6 }, (_, index) => { const point = polarPoint(index, 6, 1); return <line key={index} x1={radarCenter} y1={radarCenter} x2={point.x} y2={point.y} stroke="currentColor" strokeDasharray="2 7" strokeWidth="1" />; })}
              <circle cx={radarCenter} cy={radarCenter} r="7" fill="currentColor" fillOpacity="0.35" />
            </svg>
            <div className="relative max-w-sm">
              <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl border border-slate-300/15 bg-slate-300/[.06] font-mono text-base text-slate-300">∿</span>
              <p className="mt-4 text-sm font-medium text-slate-200">Awaiting verified evidence</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">TrustDNA will not turn uploaded text into unverified skill or personality claims.</p>
            </div>
          </div>
          <p className="sr-only">Skill Radar is awaiting verified evidence. TrustDNA has not inferred any skills from this identity data.</p>
        </motion.div>
      </section>
    );
  }

  const dataPolygon = polygonPoints(signals, 1);

  return (
    <section aria-labelledby={titleId} className="glass relative overflow-hidden rounded-[1.65rem] border border-white/[.1] p-5 shadow-2xl shadow-black/20 sm:p-6">
      <div aria-hidden="true" className="absolute -left-24 -top-24 size-56 rounded-full bg-cyan-300/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 -bottom-24 size-56 rounded-full bg-violet-400/10 blur-3xl" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="relative"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-medium tracking-[.18em] text-violet-200/75">IDENTITY INTELLIGENCE</p>
            <h3 id={titleId} className="mt-1.5 text-lg font-medium tracking-tight text-white">Writing signal radar</h3>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-400">Deterministic measurements from the current text extractor. This is not a skills, personality, or competence assessment.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 font-mono text-[10px] font-medium tracking-[.13em] text-cyan-100">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-cyan-100 shadow-[0_0_9px_#a8edff]" />
            DETERMINISTIC SIGNALS
          </span>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,.88fr)_minmax(16rem,1.12fr)] xl:items-center">
          <div className="relative grid min-h-80 place-items-center overflow-hidden rounded-2xl border border-white/[.08] bg-[#060a20]/70 p-4">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(84,209,255,.16),transparent_44%)]" />
            <svg aria-hidden="true" className="relative w-full max-w-80" viewBox={`0 0 ${radarSize} ${radarSize}`} fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={fillGradientId} x1="52" y1="32" x2="262" y2="286" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6ee7ff" stopOpacity="0.42" />
                  <stop offset="1" stopColor="#ae8cff" stopOpacity="0.16" />
                </linearGradient>
                <linearGradient id={edgeGradientId} x1="56" y1="40" x2="268" y2="288" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#a6f2ff" />
                  <stop offset="1" stopColor="#c9b8ff" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={polygonPoints(signals, scale)} stroke="#aab7dc" strokeDasharray={scale === 1 ? "0" : "3 7"} strokeOpacity={scale === 1 ? "0.38" : "0.18"} strokeWidth="1" />)}
              {signals.map((signal, index) => {
                const point = polarPoint(index, signals.length, 1);
                const label = labelPoint(index, signals.length);
                return (
                  <g key={signal.label}>
                    <line x1={radarCenter} y1={radarCenter} x2={point.x} y2={point.y} stroke="#b8c5e8" strokeDasharray="2 7" strokeOpacity="0.32" strokeWidth="1" />
                    <text x={label.x} y={label.y} fill="#bac5e5" fontFamily="var(--font-geist-mono), ui-monospace, monospace" fontSize="8" fontWeight="600" letterSpacing="0.3" textAnchor={label.anchor}>{signal.label.toUpperCase()}</text>
                  </g>
                );
              })}
              <motion.polygon
                points={dataPolygon}
                fill={`url(#${fillGradientId})`}
                stroke={`url(#${edgeGradientId})`}
                strokeWidth="1.6"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.56, ease: "easeOut" }}
                style={{ transformOrigin: `${radarCenter}px ${radarCenter}px` }}
              />
              {signals.map((signal, index) => {
                const point = polarPoint(index, signals.length, signal.normalized);
                return <motion.circle key={signal.label} cx={point.x} cy={point.y} r="3.6" fill="#daf9ff" stroke="#8f7eff" strokeWidth="1.2" initial={reduceMotion ? false : { opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25, delay: reduceMotion ? 0 : 0.22 + index * 0.055 }} style={{ transformOrigin: `${point.x}px ${point.y}px` }} />;
              })}
              <circle cx={radarCenter} cy={radarCenter} r="5" fill="#d6caff" />
            </svg>
          </div>

          <dl className="grid gap-2 sm:grid-cols-2">
            {signals.map((signal, index) => (
              <motion.div
                key={signal.label}
                initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: reduceMotion ? 0 : 0.08 + index * 0.045, ease: "easeOut" }}
                className="rounded-xl border border-white/[.08] bg-white/[.025] p-3.5"
              >
                <dt className="font-mono text-[10px] font-medium tracking-[.11em] text-slate-500">{signal.label.toUpperCase()}</dt>
                <dd className="mt-2 text-sm font-medium text-slate-100">{signal.value}</dd>
                <p className="mt-1 text-xs leading-5 text-slate-500">{signal.detail}</p>
              </motion.div>
            ))}
          </dl>
        </div>

        <div className="mt-5 rounded-xl border border-cyan-200/[.09] bg-cyan-300/[.035] px-4 py-3 text-xs leading-5 text-slate-400">
          <span className="font-medium text-cyan-100">Evidence boundary:</span> these six values are visualized directly from text-feature fields. They do not establish verified skills, interests, intent, or behavioral traits.
        </div>

        <dl className="sr-only">
          {signals.map((signal) => <div key={signal.label}><dt>{signal.label}</dt><dd>{signal.value}. {signal.detail}.</dd></div>)}
        </dl>
      </motion.div>
    </section>
  );
}
