"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight, BrainCircuit, Check, Fingerprint, LoaderCircle, LockKeyhole, Play, RefreshCcw, ScanSearch, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { CaseFile } from "@/components/case-file";
import { EvidenceReport } from "@/components/evidence-report";
import { TrustCertificate } from "@/components/trust-certificate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth-provider";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import { buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { loadGenomeIntelligence } from "@/features/identity-intelligence/api";
import { addSessionSource, browserGenomeStore } from "@/features/identity-intelligence/session";
import type { GenomeSnapshot, SourceRecord } from "@/features/identity-intelligence/types";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import { IdentityTwinService } from "@/features/identity-twin/service";
import { GenomeUpdateTimeline } from "@/features/live-investigation/genome-update-timeline";
import { InvestigationProgressController } from "@/features/live-investigation/investigation-progress-controller";
import { KnowledgeAnimationEngine } from "@/features/live-investigation/knowledge-animation-engine";
import { LiveInvestigationOrchestrator } from "@/features/live-investigation/live-investigation-orchestrator";
import { TwinRefreshCoordinator } from "@/features/live-investigation/twin-refresh-coordinator";
import type { GenomeUpdate, InvestigationProgressItem } from "@/features/live-investigation/types";
import type { InvestigationResult, Scenario } from "@/features/judge/types";

const orchestrator = new LiveInvestigationOrchestrator();
const progressController = new InvestigationProgressController();
const knowledgeAnimation = new KnowledgeAnimationEngine();
const genomeTimeline = new GenomeUpdateTimeline();
const twinRefresh = new TwinRefreshCoordinator();
const twin = new IdentityTwinService();
const guardianEvents = new GuardianEventBus();

type ResultView = "summary" | "case" | "certificate" | "report";

export function LiveInvestigationWorkspace() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Consented text evidence");
  const [fileError, setFileError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<InvestigationProgressItem[]>([]);
  const [snapshot, setSnapshot] = useState<GenomeSnapshot | null>(null);
  const [beforeSnapshot, setBeforeSnapshot] = useState<GenomeSnapshot | null>(null);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [resultView, setResultView] = useState<ResultView>("summary");
  const [revealedFactCount, setRevealedFactCount] = useState(0);
  const [twinQuestion, setTwinQuestion] = useState("Who am I?");
  const [twinAnswer, setTwinAnswer] = useState<string | null>(null);
  const [guardianActivity, setGuardianActivity] = useState("Guardian is monitoring your current Identity Genome.");

  const isReady = content.trim().length >= 20 && sourceLabel.trim().length > 0 && !running;

  async function importTextFile(file: File) {
    setFileError(null);
    if (!/\.(txt|md|eml)$/i.test(file.name) && !file.type.startsWith("text/")) {
      setFileError("Live Investigation currently accepts text, Markdown, and .eml evidence. PDF and media adapters are not available in this backend contract yet.");
      return;
    }
    if (file.size > 120_000) {
      setFileError("Choose an evidence file smaller than 120 KB for this live text pipeline.");
      return;
    }
    const text = await file.text();
    setContent(text);
    setSourceLabel(file.name.replace(/\.[^.]+$/, "") || "Consented text evidence");
  }

  async function handleRunWithResult() {
    if (!user || !isReady) return;
    const userId = user.uid;
    const previous = browserGenomeStore.load(userId);
    const inputContent = content.trim();
    const inputLabel = sourceLabel.trim();
    let before: GenomeSnapshot | null = null;
    if (previous) {
      try {
        before = await buildGenomeSnapshot(await loadGenomeIntelligence(previous.genomeId), previous.sources, knowledgeRepository.load(userId));
      } catch {
        // A previous browser-session reference can expire when the backend restarts.
        // The live flow still proceeds with a fresh evidence-backed version.
      }
    }
    setBeforeSnapshot(before);
    setRunning(true);
    setError(null);
    setResult(null);
    setSnapshot(null);
    setTwinAnswer(null);
    setRevealedFactCount(0);
    setProgress(progressController.initial(!previous?.genomeId));
    setGuardianActivity("I’m reading your consented evidence and preparing an investigation.");
    guardianEvents.publish("investigation_started", "Sentinel opened a live investigation from consented evidence.");

    try {
      await orchestrator.run({ content: inputContent, sourceLabel: inputLabel, displayName: user.displayName ?? user.email ?? "TrustDNA member", genomeId: previous?.genomeId }, async (event) => {
        if (event.type === "error") {
          const message = isRecord(event.data) && typeof event.data.message === "string" ? event.data.message : "The live investigation could not be completed.";
          throw new Error(message);
        }
        setProgress((items) => progressController.advance(items, event.type));

        if (event.type === "genome_updated") {
          const update = event.data as GenomeUpdate;
          const version = update.profile?.version ?? update.versions.at(-1)?.version ?? "unversioned";
          const timestamp = update.profile?.updated_at ?? update.versions.at(-1)?.created_at ?? new Date().toISOString();
          const source: SourceRecord = { id: `${update.genome.id}-${timestamp}-${inputLabel}`, sourceId: `live-${Date.now()}`, label: inputLabel, status: "ingested", origin: "extracted", addedAt: timestamp, genomeVersion: version };
          const session = previous?.genomeId === update.genome.id ? addSessionSource(previous, source) : { genomeId: update.genome.id, ownerId: update.genome.owner_id, sources: [source] };
          browserGenomeStore.save(userId, session);
          const merged = knowledgeAnimation.extract({ content: inputContent, sourceLabel: inputLabel, genomeVersion: version, timestamp }, knowledgeRepository.load(userId));
          knowledgeRepository.save(userId, merged.objects);
          const nextSnapshot = await genomeTimeline.record(update, session.sources, merged.objects);
          setSnapshot(nextSnapshot);
          setRevealedFactCount(merged.objects.filter((fact) => fact.status === "active").length);
          setProgress((items) => progressController.advance(items, "knowledge_extracted"));
          setProgress((items) => progressController.advance(items, "genome_merged"));
          guardianEvents.publish("genome_updated", `Genome ${version} recorded from the live evidence artifact.`);
          setGuardianActivity("I updated your Identity Genome with direct, traceable evidence.");
          twinRefresh.refresh(userId, nextSnapshot);
          setProgress((items) => progressController.advance(items, "twin_refreshed"));
          setProgress((items) => progressController.advance(items, "guardian_updated"));
          setGuardianActivity("I refreshed your Identity Twin against the latest Genome version.");
        }

        if (event.type === "investigation_completed") {
          const payload = event.data as { result?: InvestigationResult };
          if (!payload.result) throw new Error("The backend did not return an investigation result.");
          setResult(payload.result);
          setScenario({ id: "uploaded-evidence", title: inputLabel, subject: inputLabel, artifactReference: payload.result.investigation.artifact_reference, candidateText: inputContent, seedText: "Live evidence is compared to the active Identity Genome.", icon: "file" });
          setResultView("summary");
          setProgress((items) => progressController.advance(items, "evidence_correlated"));
          setProgress((items) => progressController.advance(items, "risk_analyzed"));
          setProgress((items) => progressController.advance(items, "certificate_generated"));
          guardianEvents.publish("investigation_completed", `Case ${payload.result.investigation.case_number} reached an evidence-backed verdict.`);
          guardianEvents.publish("certificate_generated", `Certificate ${payload.result.certificate.certificate_number} is ready.`);
          if (["high", "critical"].includes(payload.result.investigation.risk_level)) guardianEvents.publish("threat_detected", `Risk Engine marked this artifact ${payload.result.investigation.risk_level} risk.`);
          setGuardianActivity("I completed the evidence-backed investigation and linked the resulting case, report, and certificate.");
        }
      });
    } catch (cause) {
      setProgress((items) => progressController.fail(items));
      setError(cause instanceof Error ? cause.message : "The live investigation could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setResult(null);
    setScenario(null);
    setSnapshot(null);
    setBeforeSnapshot(null);
    setProgress([]);
    setError(null);
    setTwinAnswer(null);
    setRevealedFactCount(0);
  }

  function askTwin() {
    if (!snapshot || !twinQuestion.trim()) return;
    const response = twin.answer(twinQuestion.trim(), snapshot);
    setTwinAnswer(response.answer);
    guardianEvents.publish(response.intent === "unknown" ? "unknown_question" : "twin_answered", response.intent === "unknown" ? "Twin needs more direct evidence for that question." : "Twin answered from the current evidence boundary.");
  }

  const completed = progress.filter((item) => item.status === "complete").length;
  const progressPercent = progress.length ? Math.round((completed / progress.length) * 100) : 0;

  if (result && scenario && resultView !== "summary") {
    if (resultView === "certificate") return <TrustCertificate result={result} onStartNewInvestigation={reset} onViewCaseFile={() => setResultView("case")} onViewEvidenceReport={() => setResultView("report")} />;
    if (resultView === "report") return <EvidenceReport result={result} onReturnToCaseFile={() => setResultView("case")} onStartNewInvestigation={reset} onViewCertificate={() => setResultView("certificate")} />;
    return <><CaseFile result={result} scenario={scenario} onBackToJudgeMode={() => { window.location.href = "/demo"; }} onRunNewInvestigation={reset} /><section className="mx-auto max-w-7xl px-5 pb-12 md:px-8"><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setResultView("certificate")}>View Certificate</Button><Button variant="outline" onClick={() => setResultView("report")}>View Evidence Report</Button></div></section></>;
  }

  return <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">LIVE IDENTITY INVESTIGATION</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Trace evidence into truth.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Bring a consented text artifact into a real backend investigation. TrustDNA updates the Identity Genome, extracts only direct knowledge, refreshes the Twin, and opens a forensic Case File.</p></div>
      <div className="rounded-xl border border-cyan-200/15 bg-cyan-300/[.05] px-3 py-2 text-xs text-cyan-100"><LockKeyhole aria-hidden="true" className="mr-1.5 inline size-3.5" />Text is analyzed for this request; this page does not retain the raw artifact.</div>
    </div>

    <div className="mt-8 grid gap-5 xl:grid-cols-[.94fr_1.06fr]">
      <Card className="glass border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">EVIDENCE INTAKE</p><h2 className="mt-2 text-xl font-medium text-white">Add a real text artifact</h2><p className="mt-2 text-xs leading-5 text-slate-400">TXT, Markdown, and .eml inputs are supported by the active backend contract.</p></div><span className="grid size-10 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#c5bcff]"><Upload aria-hidden="true" className="size-5" /></span></div>
        <label className="mt-6 block"><span className="font-mono text-[10px] tracking-[.12em] text-slate-500">SOURCE LABEL</span><input value={sourceLabel} disabled={running} onChange={(event) => setSourceLabel(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#b6aaff]/60" maxLength={120} /></label>
        <div className="mt-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] tracking-[.12em] text-slate-500">TEXT EVIDENCE</span><button type="button" disabled={running} onClick={() => uploadRef.current?.click()} className="text-xs text-[#c5bcff] transition hover:text-white">Import text file</button><input ref={uploadRef} type="file" accept=".txt,.md,.eml,text/plain,text/markdown,message/rfc822" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importTextFile(file); event.currentTarget.value = ""; }} /></div><textarea value={content} disabled={running} onChange={(event) => setContent(event.target.value)} placeholder="Paste consented text or import a .txt, .md, or .eml artifact…" className="mt-2 min-h-64 w-full resize-y rounded-xl border border-white/[.1] bg-black/20 p-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#b6aaff]/60 disabled:opacity-60" maxLength={120000} /><p className="mt-2 text-right font-mono text-[10px] text-slate-600">{content.length.toLocaleString()} / 120,000 CHARACTERS</p></div>
        {fileError && <p role="alert" className="mt-3 rounded-xl border border-amber-200/15 bg-amber-200/[.06] px-3 py-2 text-xs leading-5 text-amber-100">{fileError}</p>}
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200/15 bg-red-300/[.07] px-3 py-2 text-xs leading-5 text-red-100">{error}</p>}
        <Button onClick={handleRunWithResult} disabled={!isReady} className="mt-5 h-11 w-full rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Play aria-hidden="true" className="size-4" />{running ? "Sentinel is investigating…" : "Start live investigation"}</Button>
      </CardContent></Card>

      <Card className="glass relative overflow-hidden border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" /><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-200">SENTINEL LIVE TRACE</p><h2 className="mt-2 text-xl font-medium text-white">Backend-backed execution</h2><p aria-live="polite" className="mt-2 text-xs leading-5 text-slate-400">{running ? "Events appear only after their investigation stage returns." : "Start an investigation to view its live evidence trail."}</p></div><span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><ScanSearch aria-hidden="true" className={`size-5 ${running ? "animate-pulse" : ""}`} /></span></div>
        <div className="mt-5 rounded-xl border border-[#a99bff]/15 bg-[#8b78f6]/[.06] p-3 text-xs leading-5 text-[#e2deff]"><Sparkles aria-hidden="true" className="mr-2 inline size-3.5 text-[#c7beff]" /><span aria-live="polite">{guardianActivity}</span></div>
        <div className="mt-6"><div className="flex items-center justify-between text-xs"><span className="text-slate-400">Investigation progress</span><span className="font-mono text-[#c7beff]">{progressPercent}%</span></div><Progress value={progressPercent} className="mt-2 h-1.5 bg-white/[.08] [&>div]:bg-gradient-to-r [&>div]:from-[#9b82ff] [&>div]:to-cyan-300" /></div>
        <ol className="mt-7 space-y-0">{progress.length ? progress.map((item, index) => <motion.li key={item.id} initial={{ opacity: 0, x: reduceMotion ? 0 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * .04 }} className="relative flex gap-4 pb-5 last:pb-0"><span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-1px)] w-px bg-white/[.08] last:hidden" /><span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full border ${item.status === "complete" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : item.status === "error" ? "border-red-300/20 bg-red-400/10 text-red-100" : "border-white/[.12] bg-white/[.04] text-slate-500"}`}>{item.status === "complete" ? <Check className="size-3" /> : item.status === "error" ? <AlertTriangle className="size-3" /> : running ? <LoaderCircle className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}</span><div className="min-w-0 pt-0.5"><p className="text-sm text-slate-200">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p></div></motion.li>) : <li className="rounded-xl border border-dashed border-white/[.1] bg-black/10 p-5 text-center text-xs leading-5 text-slate-500">No synthetic activity feed: this trace begins when the live backend workflow starts.</li>}</ol>
      </CardContent></Card>
    </div>

    <AnimatePresence>{snapshot && <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
      <Card className="glass border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">GENOME UPDATE TIMELINE</p><h2 className="mt-2 text-lg font-medium text-white">Evidence became a versioned record</h2></div><Fingerprint aria-hidden="true" className="size-5 text-[#c7beff]" /></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><MiniMetric label="GENOME VERSION" value={snapshot.latestVersion?.version ?? "Not returned"} /><MiniMetric label="CONFIDENCE" value={snapshot.genomeConfidence === undefined ? "Not returned" : `${snapshot.genomeConfidence}%`} /><MiniMetric label="DIRECT FACTS" value={String(revealedFactCount)} /></div><div className="mt-6 space-y-3">{snapshot.timeline.slice(0, 4).map((event) => <div key={event.id} className="rounded-xl border border-white/[.07] bg-black/10 p-3"><p className="text-xs font-medium text-slate-200">{event.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p></div>)}</div></CardContent></Card>
      <Card className="glass overflow-hidden border-white/[.1]"><CardContent className="relative p-5 md:p-7"><div className="absolute -right-10 -top-12 size-48 rounded-full bg-[#806cff]/15 blur-3xl" /><div className="relative flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-200">IDENTITY KNOWLEDGE GRAPH</p><h2 className="mt-2 text-lg font-medium text-white">Only direct evidence is connected</h2></div><Sparkles aria-hidden="true" className="size-5 text-cyan-100" /></div><div className="relative mt-7 grid min-h-52 place-items-center overflow-hidden rounded-2xl border border-white/[.07] bg-[#05081e]/70"><span className="absolute h-px w-2/3 rotate-[18deg] bg-gradient-to-r from-transparent via-[#a99bff]/50 to-transparent" /><span className="absolute h-px w-2/3 -rotate-[18deg] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" /><span className="relative grid size-20 place-items-center rounded-full border border-[#b5a8ff]/35 bg-[#8b78f6]/15 text-center font-mono text-[10px] tracking-[.12em] text-[#dfd9ff] shadow-[0_0_50px_rgba(139,120,246,.28)]">IDENTITY<br />GENOME</span><div className="absolute inset-5 grid grid-cols-2 content-between gap-3">{snapshot.identityFacts.slice(0, 4).map((fact) => <motion.span key={fact.id} initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} className="rounded-lg border border-cyan-200/15 bg-cyan-300/[.06] px-2 py-1.5 text-center font-mono text-[9px] tracking-[.08em] text-cyan-100">{fact.title}</motion.span>)}</div>{!snapshot.identityFacts.length && <p className="absolute bottom-5 max-w-xs text-center text-xs leading-5 text-slate-500">No direct identity facts matched this artifact. Text features can still support the versioned Genome.</p>}</div></CardContent></Card>
    </motion.div>}</AnimatePresence>

    {snapshot && <Card className="glass mt-5 border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">GENOME BEFORE / AFTER</p><h2 className="mt-2 text-lg font-medium text-white">A versioned change, not a black box</h2><p className="mt-1 text-xs leading-5 text-slate-500">The comparison uses the previous browser-session Genome when it was available from the live backend.</p></div><Fingerprint aria-hidden="true" className="size-5 text-[#c7beff]" /></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr]"><GenomeState title="GENOME BEFORE" snapshot={beforeSnapshot} /><div className="grid place-items-center py-2 text-[#c5bcff]"><ArrowRight aria-hidden="true" className="size-5" /></div><GenomeState title="GENOME AFTER" snapshot={snapshot} /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><MiniMetric label="KNOWLEDGE ADDED" value={String(Math.max(0, snapshot.identityFacts.length - (beforeSnapshot?.identityFacts.length ?? 0)))} /><MiniMetric label="KNOWLEDGE UPDATED" value={String(snapshot.knowledgeHistory.filter((fact) => fact.status === "superseded").length)} /><MiniMetric label="CONFIDENCE CHANGE" value={confidenceChange(beforeSnapshot, snapshot)} /></div></CardContent></Card>}

    {result && <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5"><Card className="glass overflow-hidden border-[#c5baff]/25"><CardContent className="relative p-5 md:p-7"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d0c8ff] to-transparent" /><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#c7beff]">LIVE INVESTIGATION COMPLETE</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{titleCase(result.investigation.verdict)}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Sentinel completed a real backend case. The evidence, Risk Engine result, certificate, and report below are derived from that returned contract.</p></div><span className={`rounded-xl border px-3 py-2 font-mono text-xs tracking-[.1em] ${["high", "critical"].includes(result.investigation.risk_level) ? "border-red-200/25 bg-red-400/10 text-red-100" : "border-emerald-200/25 bg-emerald-400/10 text-emerald-100"}`}>{result.investigation.risk_level.toUpperCase()} RISK</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MiniMetric label="CASE ID" value={result.investigation.case_number} /><MiniMetric label="EVIDENCE COUNT" value={String(result.agents.reduce((total, agent) => total + agent.evidence.length, 0))} /><MiniMetric label="AGENTS RETURNED" value={String(result.agents.length)} /><MiniMetric label="TRUST RATING" value={result.certificate.trust_rating} /></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => setResultView("case")} className="bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><ShieldCheck aria-hidden="true" className="size-4" />Open Case File</Button><Button onClick={() => setResultView("certificate")} variant="outline" className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white">View Certificate</Button><Button onClick={() => setResultView("report")} variant="outline" className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white">View Evidence Report</Button><Button onClick={reset} variant="outline" className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><RefreshCcw aria-hidden="true" className="size-4" />New investigation</Button></div></CardContent></Card></motion.div>}

    {snapshot && <Card className="glass mt-5 border-white/[.1]"><CardContent className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">IDENTITY TWIN</p><h2 className="mt-2 text-lg font-medium text-white">Ask the refreshed Twin</h2><p className="mt-1 text-xs leading-5 text-slate-500">Answers are grounded in the exact fact provenance and feature evidence now in this Genome.</p></div><Link href="/twin" className="inline-flex items-center gap-1 text-xs text-[#c5bcff] hover:text-white">Open full Twin <ArrowRight className="size-3.5" /></Link></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={twinQuestion} onChange={(event) => setTwinQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askTwin(); }} className="h-11 min-w-0 flex-1 rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm text-slate-100 outline-none focus:border-[#b6aaff]/60" /><Button onClick={askTwin} variant="outline" className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><BrainCircuit className="size-4" />Ask Twin</Button></div>{twinAnswer && <div role="status" className="mt-4 rounded-xl border border-[#a99bff]/15 bg-[#8b78f6]/[.07] p-4 text-sm leading-6 text-slate-200">{twinAnswer}</div>}</CardContent></Card>}
  </section>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><p className="font-mono text-[9px] tracking-[.12em] text-slate-600">{label}</p><p className="mt-2 break-all text-sm font-medium text-slate-200">{value}</p></div>;
}

function GenomeState({ snapshot, title }: { snapshot: GenomeSnapshot | null; title: string }) {
  return <div className="rounded-xl border border-white/[.08] bg-black/15 p-4"><p className="font-mono text-[9px] tracking-[.12em] text-slate-600">{title}</p>{snapshot ? <div className="mt-3 space-y-2 text-xs"><p className="text-slate-200">{snapshot.latestVersion?.version ?? "No returned version"}</p><p className="text-slate-500">{snapshot.identityFacts.length} direct fact{snapshot.identityFacts.length === 1 ? "" : "s"}</p><p className="text-slate-500">{snapshot.genomeConfidence === undefined ? "Confidence not returned" : `${snapshot.genomeConfidence}% confidence`}</p></div> : <p className="mt-3 text-xs leading-5 text-slate-500">No prior live backend snapshot was available in this browser session.</p>}</div>;
}

function confidenceChange(before: GenomeSnapshot | null, after: GenomeSnapshot): string {
  if (before?.genomeConfidence === undefined || after.genomeConfidence === undefined) return "Not available";
  const delta = after.genomeConfidence - before.genomeConfidence;
  return `${delta >= 0 ? "+" : ""}${delta} pts`;
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
