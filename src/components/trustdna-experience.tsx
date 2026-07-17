"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseFile } from "@/components/case-file";
import { EvidenceReport } from "@/components/evidence-report";
import { InvestigationConsole } from "@/components/investigation-console";
import { JudgeMode } from "@/components/judge-mode";
import { LandingPage } from "@/components/landing-page";
import { TrustCertificate, TrustCertificateSkeleton } from "@/components/trust-certificate";
import { runJudgeScenario } from "@/features/judge/api";
import { judgeScenarios } from "@/features/judge/scenarios";
import type { InvestigationResult, Scenario } from "@/features/judge/types";

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
const INVESTIGATION_STEP_DELAY_MS = 580;
const VERDICT_REVEAL_DELAY_MS = 450;

export function TrustDNAExperience() {
  const [selected, setSelected] = useState<Scenario>(judgeScenarios[0]);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function goToJudgeMode() {
    document.getElementById("judge-mode")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function startInvestigation() {
    setError(null);
    setResult(null);
    setRunning(true);
    setActiveStep(0);
    await wait(80);
    document.getElementById("live-investigation")?.scrollIntoView({ behavior: "smooth", block: "center" });

    const request = runJudgeScenario(selected);
    for (let step = 1; step < 8; step += 1) {
      await wait(INVESTIGATION_STEP_DELAY_MS);
      setActiveStep(step);
    }

    try {
      const completedResult = await request;
      setResult(completedResult);
      setActiveStep(8);
      await wait(VERDICT_REVEAL_DELAY_MS);
      document.getElementById("case-file")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The investigation could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app-backdrop min-h-screen overflow-hidden">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative">
        <LandingPage onStart={goToJudgeMode} />
        <JudgeMode selected={selected} onSelect={setSelected} onStart={startInvestigation} disabled={running} />

        <AnimatePresence>
          {(running || error || result) && (
            <motion.div id="live-investigation" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {running && <InvestigationConsole activeStep={activeStep} />}
              {running && activeStep >= 7 && <TrustCertificateSkeleton />}
              {error && <div className="mx-auto max-w-4xl px-5 pb-8 md:px-10"><div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-400/[.08] p-5 text-red-100"><div className="flex items-center gap-3"><AlertCircle className="size-5" /><p className="text-sm">{error}</p></div><Button onClick={startInvestigation} variant="outline" className="border-red-200/25 bg-transparent text-red-100 hover:bg-red-100/10 hover:text-white">Retry investigation</Button></div></div>}
            </motion.div>
          )}
        </AnimatePresence>

        {result && <motion.div id="case-file" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}><CaseFile result={result} scenario={selected} onBackToJudgeMode={goToJudgeMode} onRunNewInvestigation={startInvestigation} /><TrustCertificate result={result} onStartNewInvestigation={startInvestigation} onViewCaseFile={() => document.getElementById("case-file")?.scrollIntoView({ behavior: "smooth", block: "start" })} onViewEvidenceReport={() => document.getElementById("evidence-report")?.scrollIntoView({ behavior: "smooth", block: "start" })} /><EvidenceReport result={result} /></motion.div>}

        <section className="mx-auto max-w-7xl px-5 pb-20 pt-12 md:px-10">
          <div className="grid gap-5 border-t border-white/[.08] pt-12 md:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">HOW TRUSTDNA WORKS</p><h2 className="mt-3 text-2xl font-semibold text-white">Identity Genome → Evidence → Trust</h2></div>
            <div className="grid gap-4 sm:grid-cols-3">{[{ icon: ShieldCheck, label: "Identity Genome", body: "Versioned, explainable traits—not a black box." }, { icon: Cpu, label: "Forensic agents", body: "Structured evidence flows through Sentinel." }, { icon: ShieldCheck, label: "Trust credential", body: "A certificate is created from the Case File." }].map(({ icon: Icon, label, body }) => <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-5" key={label}><Icon className="size-5 text-[#ad9fff]" /><p className="mt-4 text-sm font-medium text-slate-100">{label}</p><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
