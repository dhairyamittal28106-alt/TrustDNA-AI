"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, BrainCircuit, Database, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { emptyGenomeSnapshot, buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { loadGenomeIntelligence } from "@/features/identity-intelligence/api";
import { browserGenomeStore } from "@/features/identity-intelligence/session";
import { GuardianConsole } from "@/features/guardian/components/guardian-console";
import { GuardianRenderer } from "@/features/guardian/components/guardian-renderer";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import { GuardianIntelligenceService } from "@/features/guardian/guardian-intelligence-service";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GuardianEvent } from "@/features/guardian/types";

const guardianService = new GuardianIntelligenceService();
const guardianEvents = new GuardianEventBus();

export function GuardianDashboardPanel() {
  const { user, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();
  const [snapshot, setSnapshot] = useState<GenomeSnapshot>(() => emptyGenomeSnapshot());
  const [event, setEvent] = useState<GuardianEvent | undefined>();
  const [loading, setLoading] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => guardianEvents.subscribe(setEvent), []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (authLoading) return;
      if (!user) {
        if (active) setSnapshot(emptyGenomeSnapshot());
        if (active) setLoading(false);
        return;
      }
      const session = browserGenomeStore.load(user.uid);
      if (!session) {
        if (active) setSnapshot(emptyGenomeSnapshot());
        if (active) setLoading(false);
        return;
      }
      try {
        const payload = await loadGenomeIntelligence(session.genomeId);
        const next = await buildGenomeSnapshot(payload, session.sources, knowledgeRepository.load(user.uid));
        if (active) setSnapshot(next);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [authLoading, event?.id, user]);

  const overview = guardianService.build(snapshot, event);
  return <section aria-labelledby="guardian-dashboard-heading" className="glass overflow-hidden rounded-[1.75rem] border border-cyan-200/[.12] bg-[#090d25]/85 p-5 shadow-2xl shadow-black/30 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">IDENTITY GUARDIAN</p><h2 id="guardian-dashboard-heading" className="mt-2 text-xl font-medium text-white">Your evidence-bound companion</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">The Guardian learns only from direct structured Identity Knowledge and current Genome state.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-2.5 py-1 font-mono text-[9px] tracking-[.12em] text-cyan-100"><span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-cyan-200" />{overview.state.toUpperCase()}</span></div><div className="mt-6 grid gap-5 sm:grid-cols-[10rem_1fr]"><GuardianRenderer state={overview.state} /><motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .28 }} className="min-w-0"><div className="rounded-2xl border border-white/[.08] bg-black/[.14] p-4"><div className="flex items-center gap-2"><Sparkles aria-hidden="true" className="size-4 text-[#c8c0ff]" /><p className="font-mono text-[9px] tracking-[.13em] text-[#d0caff]">CURRENT ACTIVITY</p></div><p className="mt-3 text-sm leading-6 text-slate-100">{loading ? "Loading current Genome state..." : overview.activity}</p></div><dl className="mt-4 grid grid-cols-2 gap-3"><GuardianMetric icon={Activity} label="Status" value={overview.status} /><GuardianMetric icon={Database} label="Knowledge" value={`${overview.knowledgeCount} fact${overview.knowledgeCount === 1 ? "" : "s"}`} /><GuardianMetric icon={BrainCircuit} label="Genome" value={overview.genomeVersion} /><GuardianMetric icon={ShieldCheck} label="Confidence" value={overview.confidence === undefined ? "Awaiting" : `${overview.confidence}%`} /></dl></motion.div></div><div className="mt-5 border-t border-white/[.08] pt-4"><p className="font-mono text-[9px] tracking-[.13em] text-slate-500">GUARDIAN INSIGHTS</p><ul className="mt-3 space-y-2">{overview.insights.map((insight) => <li key={insight} className="text-xs leading-5 text-slate-400">{insight}</li>)}</ul><Button type="button" onClick={() => setConsoleOpen(true)} variant="outline" className="mt-4 border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white">Open Guardian Console <ArrowUpRight className="size-3.5" /></Button></div>{consoleOpen && <GuardianConsole overview={overview} onClose={() => setConsoleOpen(false)} />}</section>;
}

function GuardianMetric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-black/[.1] p-3"><Icon aria-hidden="true" className="size-3.5 text-[#c3bbff]" /><dt className="mt-3 font-mono text-[8px] tracking-[.11em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[11px] text-slate-200">{value}</dd></div>; }
