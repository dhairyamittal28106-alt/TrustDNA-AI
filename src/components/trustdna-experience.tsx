"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseFile } from "@/components/case-file";
import { EvidenceReport, EvidenceReportSkeleton } from "@/components/evidence-report";
import { InvestigationConsole } from "@/components/investigation-console";
import { IdentityGenomeHologram } from "@/components/identity-genome-hologram";
import { JudgeMode } from "@/components/judge-mode";
import { LandingPage } from "@/components/landing-page";
import { TrustCertificate, TrustCertificateSkeleton } from "@/components/trust-certificate";
import { runJudgeScenario } from "@/features/judge/api";
import { judgeScenarios } from "@/features/judge/scenarios";
import type { InvestigationResult, Scenario } from "@/features/judge/types";
import type { HologramPhase } from "@/components/identity-genome-hologram";

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));
const INVESTIGATION_STEP_DELAY_MS = 580;
const VERDICT_REVEAL_DELAY_MS = 450;

function getHologramState(running: boolean, activeStep: number, result: InvestigationResult | null): { phase: HologramPhase; currentState: string } {
  if (result) {
    if (result.investigation.verdict === "authentic") return { phase: "safe", currentState: "Verdict issued: identity signals consistent" };
    if (result.investigation.verdict === "inconclusive") return { phase: "suspicious", currentState: "Verdict issued: evidence requires review" };
    return { phase: "impersonation", currentState: "Verdict issued: identity conflict confirmed" };
  }
  if (!running) return { phase: "idle", currentState: "Judge Mode ready" };
  if (activeStep <= 1) return { phase: "genome_creation", currentState: "Collecting and classifying evidence" };
  if (activeStep === 2) return { phase: "genesis", currentState: "Genesis reconstructing Identity Genome" };
  if (activeStep === 3) return { phase: "cipher", currentState: "Cipher comparing writing signature" };
  if (activeStep === 4) return { phase: "chronos", currentState: "Chronos validating timeline" };
  if (activeStep === 5) return { phase: "forensiq", currentState: "ForensIQ inspecting metadata signals" };
  if (activeStep === 6) return { phase: "spectra", currentState: "Spectra scanning artifact signal layer" };
  if (activeStep === 7) return { phase: "atlas", currentState: "Atlas assembling evidence report" };
  return { phase: "sentinel", currentState: "Sentinel coordinating final decision" };
}

export function TrustDNAExperience() {
  const [selected, setSelected] = useState<Scenario>(judgeScenarios[0]);
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hologram = getHologramState(running, activeStep, result);
  const hologramProps = {
    phase: hologram.phase,
    identityLabel: "Judge Demo Identity",
    trustRating: result?.certificate.trust_rating,
    genomeVersion: result?.investigation.genome_version,
    confidence: result?.certificate.identity_confidence,
    status: result?.investigation.risk_level ?? "Ready",
    currentState: hologram.currentState,
  };

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
      setActiveStep(8);
      await wait(VERDICT_REVEAL_DELAY_MS);
      setResult(completedResult);
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
      <div className="relative xl:pr-64 2xl:pr-80">
        <div className="pointer-events-none fixed right-4 top-24 z-30 hidden w-60 xl:block 2xl:right-5 2xl:w-72"><IdentityGenomeHologram {...hologramProps} compact /></div>
        <LandingPage onStart={goToJudgeMode} heroCompanion={<IdentityGenomeHologram {...hologramProps} />} />
        <JudgeMode selected={selected} onSelect={setSelected} onStart={startInvestigation} disabled={running} />

        <AnimatePresence>
          {(running || error || result) && (
            <motion.div id="live-investigation" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {running && <InvestigationConsole activeStep={activeStep} />}
              {running && activeStep >= 7 && <TrustCertificateSkeleton />}
              {running && activeStep >= 7 && <EvidenceReportSkeleton />}
              {error && <div className="mx-auto max-w-4xl px-5 pb-8 md:px-10"><div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-300/20 bg-red-400/[.08] p-5 text-red-100"><div className="flex items-center gap-3"><AlertCircle className="size-5" /><p className="text-sm">{error}</p></div><Button onClick={startInvestigation} variant="outline" className="border-red-200/25 bg-transparent text-red-100 hover:bg-red-100/10 hover:text-white">Retry investigation</Button></div></div>}
            </motion.div>
          )}
        </AnimatePresence>

        {result && <motion.div id="case-file" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}><CaseFile result={result} scenario={selected} onBackToJudgeMode={goToJudgeMode} onRunNewInvestigation={startInvestigation} /><TrustCertificate result={result} onStartNewInvestigation={startInvestigation} onViewCaseFile={() => document.getElementById("case-file")?.scrollIntoView({ behavior: "smooth", block: "start" })} onViewEvidenceReport={() => document.getElementById("evidence-report")?.scrollIntoView({ behavior: "smooth", block: "start" })} /><EvidenceReport result={result} onReturnToCaseFile={() => document.getElementById("case-file")?.scrollIntoView({ behavior: "smooth", block: "start" })} onStartNewInvestigation={startInvestigation} onViewCertificate={() => document.getElementById("certificate")?.scrollIntoView({ behavior: "smooth", block: "start" })} /></motion.div>}
      </div>
    </main>
  );
}
