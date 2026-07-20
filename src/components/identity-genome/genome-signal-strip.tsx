"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Activity, BrainCircuit, DatabaseZap, GitBranch, Radio, ShieldCheck, Sparkles, Waves } from "lucide-react";
import type { LivingHologramMetrics } from "@/components/identity-genome/types";

type GenomeSignalStripProps = { metrics: LivingHologramMetrics };

const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function GenomeSignalStrip({ metrics }: GenomeSignalStripProps) {
  const reduceMotion = useReducedMotion();
  const metricsToRender = [
    { label: "Knowledge objects", value: String(metrics.knowledgeObjects), icon: DatabaseZap },
    { label: "Evidence sources", value: String(metrics.evidenceSources), icon: GitBranch },
    { label: "Neural links", value: String(metrics.neuralLinks), icon: BrainCircuit },
    { label: "Genome confidence", value: metrics.confidence === undefined ? "Calibrating" : `${metrics.confidence.toFixed(1)}%`, icon: ShieldCheck },
    { label: "Twin status", value: metrics.twinStatus, icon: Radio },
    { label: "Last synchronization", value: metrics.lastSynchronized ? formatter.format(new Date(metrics.lastSynchronized)) : "Initial assembly", icon: Activity },
    { label: "Identity stability", value: `${metrics.stability}%`, icon: Waves },
    { label: "Signal strength", value: `${metrics.signalStrength}%`, icon: Sparkles },
  ];

  return <dl className="genome-live-signals relative z-30 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-white/[.08] pt-4 sm:grid-cols-4">
    {metricsToRender.map((metric, index) => <motion.div key={metric.label} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .32, delay: reduceMotion ? 0 : index * .035 }} className="min-w-0"><dt className="flex items-center gap-1.5 font-mono text-[8px] tracking-[.1em] text-slate-600"><metric.icon aria-hidden="true" className="size-3 text-cyan-200/70" />{metric.label.toUpperCase()}</dt><dd className="mt-1 truncate font-mono text-[11px] font-medium text-slate-200">{metric.value}</dd></motion.div>)}
  </dl>;
}
