"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, AudioLines, BrainCircuit, Check, CircleAlert, LoaderCircle, Play, ShieldCheck, Sparkles } from "lucide-react";
import { CaseFile } from "@/components/case-file";
import { EvidenceReport } from "@/components/evidence-report";
import { TrustCertificate } from "@/components/trust-certificate";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import { addSessionSource, browserGenomeStore } from "@/features/identity-intelligence/session";
import type { GenomeSnapshot, SourceRecord } from "@/features/identity-intelligence/types";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import { IdentityTwinService } from "@/features/identity-twin/service";
import { EvidenceUploader } from "@/features/investigation/components/evidence-uploader";
import { InvestigationHistory } from "@/features/investigation/components/investigation-history";
import { investigationHistory } from "@/features/investigation/investigation-history";
import { TranscriptKnowledgeAdapter } from "@/features/investigation/transcript-knowledge-adapter";
import { TranscriptService } from "@/features/investigation/transcript-service";
import type { EvidenceDraft, InvestigationHistoryRecord, InvestigationType } from "@/features/investigation/types";
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
const transcriptAdapter = new TranscriptKnowledgeAdapter();
const transcriptService = new TranscriptService();
const guardianEvents = new GuardianEventBus();
const twin = new IdentityTwinService();

const initialDraft: EvidenceDraft = { kind: "text", sourceLabel: "Consented text evidence", text: "" };

const investigationTypes: Array<{ id: InvestigationType; label: string; detail: string }> = [
  { id: "identity_verification", label: "Identity Verification", detail: "Compare consented evidence against My Identity Genome." },
  { id: "resume_verification", label: "Resume Verification", detail: "Investigate a text-based resume artifact." },
  { id: "email_investigation", label: "Email Investigation", detail: "Investigate text or a readable .eml artifact." },
  { id: "voice_transcript", label: "Voice Transcript", detail: "Investigate a supplied transcript; audio claims stay unavailable." },
  { id: "document_investigation", label: "Document Investigation", detail: "Use extracted text until document adapters arrive." },
  { id: "custom", label: "Custom Investigation", detail: "Run an evidence-backed plain-text case." },
];

type ResultView = "summary" | "case" | "certificate" | "report";

export function InvestigationWorkspace() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<EvidenceDraft>(initialDraft);
  const [investigationType, setInvestigationType] = useState<InvestigationType>("identity_verification");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [guardianActivity, setGuardianActivity] = useState("Guardian is ready to receive your consented evidence.");
  const [progress, setProgress] = useState<InvestigationProgressItem[]>([]);
  const [snapshot, setSnapshot] = useState<GenomeSnapshot | null>(null);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [resultView, setResultView] = useState<ResultView>("summary");
  const [history, setHistory] = useState<InvestigationHistoryRecord[]>([]);
  const [twinQuestion, setTwinQuestion] = useState("What did you learn from my latest evidence?");
  const [twinAnswer, setTwinAnswer] = useState<string>();
  const transcriptLengthRef = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHistory(user ? investigationHistory.load(user.uid) : []), 0);
    return () => window.clearTimeout(timeout);
  }, [user]);

  const handleDraftChange = useCallback((nextDraft: EvidenceDraft) => {
    const transcriptLength = nextDraft.kind === "voice" ? nextDraft.text.trim().length : 0;
    if (transcriptLength >= 20 && transcriptLengthRef.current < 20) {
      const detail = "Verified transcript received. It can now enter the current text investigation pipeline.";
      setGuardianActivity(detail);
      guardianEvents.publish("evidence_added", detail);
    }
    transcriptLengthRef.current = transcriptLength;
    setDraft(nextDraft);
    setError(undefined);
  }, []);

  const transcript = transcriptService.status(draft.voice, draft.text);
  const investigationInput = transcriptAdapter.contentForInvestigation(draft);
  const canRun = Boolean(user && investigationInput && investigationInput.content.length >= 20 && !running);
  const completedSteps = progress.filter((item) => item.status === "complete").length;
  const progressPercent = progress.length ? Math.round((completedSteps / progress.length) * 100) : 0;

  async function runInvestigation() {
    if (!user || !investigationInput || !canRun) return;
    const previous = browserGenomeStore.load(user.uid);
    const { content, sourceLabel } = investigationInput;
    setRunning(true);
    setError(undefined);
    setResult(null);
    setSnapshot(null);
    setTwinAnswer(undefined);
    setProgress(progressController.initial(!previous?.genomeId));
    setGuardianActivity("I received your evidence and opened a protected investigation boundary.");
    guardianEvents.publish("evidence_added", `Evidence received: ${sourceLabel}.`);
    if (draft.kind === "voice") guardianEvents.publish("twin_thinking", "A verified transcript was provided for voice transcript investigation.");

    try {
      await orchestrator.run({ content, sourceLabel, displayName: user.displayName ?? user.email ?? "TrustDNA member", genomeId: previous?.genomeId }, async (event) => {
        if (event.type === "error") {
          const message = isRecord(event.data) && typeof event.data.message === "string" ? event.data.message : "The investigation could not be completed.";
          throw new Error(message);
        }
        setProgress((items) => progressController.advance(items, event.type));
        if (event.type === "genome_updated") {
          const update = event.data as GenomeUpdate;
          const version = update.profile?.version ?? update.versions.at(-1)?.version ?? "unversioned";
          const timestamp = update.profile?.updated_at ?? update.versions.at(-1)?.created_at ?? new Date().toISOString();
          const source: SourceRecord = { id: `${update.genome.id}-${timestamp}-${sourceLabel}`, sourceId: `investigation-${draft.kind}`, label: sourceLabel, status: "ingested", origin: "extracted", addedAt: timestamp, genomeVersion: version };
          const session = previous?.genomeId === update.genome.id ? addSessionSource(previous, source) : { genomeId: update.genome.id, ownerId: update.genome.owner_id, sources: [source] };
          browserGenomeStore.save(user.uid, session);
          const merged = knowledgeAnimation.extract({ content, sourceLabel, genomeVersion: version, timestamp }, knowledgeRepository.load(user.uid));
          knowledgeRepository.save(user.uid, merged.objects);
          const nextSnapshot = await genomeTimeline.record(update, session.sources, merged.objects);
          setSnapshot(nextSnapshot);
          setProgress((items) => progressController.advance(items, "knowledge_extracted"));
          setProgress((items) => progressController.advance(items, "genome_merged"));
          setGuardianActivity(`I updated Identity Genome ${version} with direct, traceable evidence.`);
          guardianEvents.publish("genome_updated", `Identity Genome ${version} updated from the investigation evidence.`);
          twinRefresh.refresh(user.uid, nextSnapshot);
          setProgress((items) => progressController.advance(items, "twin_refreshed"));
          setProgress((items) => progressController.advance(items, "guardian_updated"));
          setGuardianActivity("I refreshed the Identity Twin against the updated evidence boundary.");
        }
        if (event.type === "investigation_completed") {
          const payload = event.data as { result?: InvestigationResult };
          if (!payload.result) throw new Error("The backend did not return an investigation result.");
          const nextResult = payload.result;
          const nextScenario: Scenario = { id: "authenticated-evidence", title: sourceLabel, subject: sourceLabel, artifactReference: nextResult.investigation.artifact_reference, candidateText: "", seedText: "", icon: draft.kind === "voice" ? "mic" : draft.kind === "email" ? "mail" : "file" };
          setResult(nextResult);
          setScenario(nextScenario);
          setResultView("summary");
          setProgress((items) => progressController.advance(items, "evidence_correlated"));
          setProgress((items) => progressController.advance(items, "risk_analyzed"));
          setProgress((items) => progressController.advance(items, "certificate_generated"));
          const record: InvestigationHistoryRecord = { id: nextResult.investigation.id, createdAt: nextResult.investigation.timeline.at(-1)?.occurred_at ?? new Date().toISOString(), investigationType, evidenceLabel: sourceLabel, evidenceKind: draft.kind, result: nextResult };
          setHistory(investigationHistory.append(user.uid, record));
          guardianEvents.publish("investigation_completed", `Case ${nextResult.investigation.case_number} reached a returned verdict.`);
          guardianEvents.publish("certificate_generated", `Certificate ${nextResult.certificate.certificate_number} is available.`);
          if (["high", "critical"].includes(nextResult.investigation.risk_level)) guardianEvents.publish("threat_detected", `Risk Engine returned ${nextResult.investigation.risk_level} risk.`);
          setGuardianActivity("I completed the investigation and connected its Case File, certificate, and Evidence Report.");
        }
      });
    } catch (cause) {
      setProgress((items) => progressController.fail(items));
      setError(cause instanceof Error ? cause.message : "The investigation could not be completed.");
      setGuardianActivity("The investigation needs your attention before it can continue.");
    } finally {
      setRunning(false);
    }
  }

  function resetInvestigation() {
    setResult(null);
    setScenario(null);
    setResultView("summary");
    setProgress([]);
    setSnapshot(null);
    setTwinAnswer(undefined);
    setError(undefined);
    setGuardianActivity("Guardian is ready to receive your consented evidence.");
  }

  function openHistory(record: InvestigationHistoryRecord) {
    setResult(record.result);
    setScenario({ id: "history", title: record.evidenceLabel, subject: record.evidenceLabel, artifactReference: record.result.investigation.artifact_reference, candidateText: "", seedText: "", icon: record.evidenceKind === "voice" ? "mic" : record.evidenceKind === "email" ? "mail" : "file" });
    setResultView("case");
  }

  function askTwin() {
    if (!snapshot || !twinQuestion.trim()) return;
    const response = twin.answer(twinQuestion.trim(), snapshot);
    setTwinAnswer(response.answer);
    guardianEvents.publish(response.intent === "unknown" ? "unknown_question" : "twin_answered", response.intent === "unknown" ? "The current Genome has no direct evidence for that question." : "Identity Twin answered from the updated evidence boundary.");
  }

  if (result && scenario && resultView !== "summary") {
    if (resultView === "certificate") return <TrustCertificate result={result} onStartNewInvestigation={resetInvestigation} onViewCaseFile={() => setResultView("case")} onViewEvidenceReport={() => setResultView("report")} />;
    if (resultView === "report") return <EvidenceReport result={result} onReturnToCaseFile={() => setResultView("case")} onStartNewInvestigation={resetInvestigation} onViewCertificate={() => setResultView("certificate")} />;
    return <><CaseFile result={result} scenario={scenario} onBackToJudgeMode={() => setResultView("summary")} onRunNewInvestigation={resetInvestigation} backLabel="Back to investigation workspace" /><section className="mx-auto max-w-7xl px-5 pb-10 md:px-8"><Button variant="outline" onClick={() => setResultView("certificate")}>View Certificate</Button><Button className="ml-2" variant="outline" onClick={() => setResultView("report")}>View Evidence Report</Button></section></>;
  }

  return <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">PERSONAL INVESTIGATION WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Investigate your own evidence.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Judge Demo remains a public showcase. This protected workspace runs your consented evidence through the same real backend investigation pipeline.</p></div><span className="rounded-xl border border-cyan-200/15 bg-cyan-300/[.06] px-3 py-2 text-xs text-cyan-100">Target · My Identity Genome</span></div>
    <fieldset className="mt-8" disabled={running}><legend className="text-sm font-medium text-slate-100">Investigation type</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{investigationTypes.map((option) => <button key={option.id} type="button" onClick={() => setInvestigationType(option.id)} aria-pressed={investigationType === option.id} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b7abff] ${investigationType === option.id ? "border-[#b1a5ff]/55 bg-[#8b78f6]/[.11]" : "border-white/[.08] bg-black/10 hover:border-[#b1a5ff]/30"}`}><p className="text-sm font-medium text-white">{option.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{option.detail}</p></button>)}</div><div className="mt-3 flex flex-wrap gap-3 text-xs"><label className="inline-flex items-center gap-2 text-slate-300"><input checked disabled type="radio" name="investigation-target" className="accent-[#9c8aff]" />My Identity Genome</label><span className="inline-flex items-center gap-2 text-slate-600"><input disabled type="radio" name="investigation-target" />Compare Identities · coming soon</span><span className="inline-flex items-center gap-2 text-slate-600"><input disabled type="radio" name="investigation-target" />External Identity · coming soon</span></div></fieldset>
    <div className="mt-5"><EvidenceUploader disabled={running} onChange={handleDraftChange} onVoiceReceived={(detail) => { setGuardianActivity(detail); guardianEvents.publish("evidence_added", detail); }} /></div>
    {draft.kind === "voice" && draft.voice && <VoiceSignalPanel duration={draft.voice.durationSeconds} transcript={transcript.transcript} language={snapshot?.features?.preferred_language} />}
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.85fr]"><Card className="glass border-white/[.1]"><CardContent className="p-5 md:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#8b78f6]/15 text-[#c9c1ff]"><Sparkles aria-hidden="true" className="size-5" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#c5bcff]">GUARDIAN STATUS</p><p aria-live="polite" className="mt-2 text-sm leading-6 text-slate-200">{guardianActivity}</p></div></div>{draft.kind === "voice" && <p className={`mt-5 rounded-xl border p-3 text-xs leading-5 ${transcript.available ? "border-emerald-200/15 bg-emerald-300/[.06] text-emerald-100" : "border-amber-200/15 bg-amber-200/[.06] text-amber-100"}`}>{transcript.message}</p>}</CardContent></Card><Card className="glass border-white/[.1]"><CardContent className="p-5 md:p-6"><p className="font-mono text-[10px] tracking-[.14em] text-cyan-200">LIVE CASE PIPELINE</p><div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-400">Returned stages</span><span className="font-mono text-[#c7beff]">{progressPercent}%</span></div><Progress value={progressPercent} className="mt-2 h-1.5 bg-white/[.08] [&>div]:bg-gradient-to-r [&>div]:from-[#9b82ff] [&>div]:to-cyan-300" /><ol className="mt-5 space-y-3">{progress.length ? progress.map((item) => <li key={item.id} className="flex gap-3"><span className={`grid size-5 shrink-0 place-items-center rounded-full border ${item.status === "complete" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : item.status === "error" ? "border-red-300/20 bg-red-400/10 text-red-100" : "border-white/[.1] text-slate-600"}`}>{item.status === "complete" ? <Check aria-hidden="true" className="size-3" /> : item.status === "error" ? <AlertTriangle aria-hidden="true" className="size-3" /> : running ? <LoaderCircle aria-hidden="true" className="size-3 animate-spin" /> : <span className="size-1 rounded-full bg-current" />}</span><div><p className="text-xs text-slate-200">{item.title}</p><p className="mt-0.5 text-[11px] leading-4 text-slate-600">{item.detail}</p></div></li>) : <li className="text-xs leading-5 text-slate-500">Case stages begin only after you run a supported evidence artifact.</li>}</ol></CardContent></Card></div>
    {error && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200/15 bg-red-300/[.07] p-4 text-sm leading-6 text-red-100"><CircleAlert aria-hidden="true" className="mt-1 size-4 shrink-0" />{error}</p>}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#b1a5ff]/18 bg-[#8b78f6]/[.06] p-5"><div><p className="text-sm font-medium text-white">Ready to investigate against your Identity Genome</p><p className="mt-1 text-xs leading-5 text-slate-400">Only text, readable email, or a user-provided voice transcript can enter the current backend pipeline.</p></div><Button disabled={!canRun} onClick={runInvestigation} className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Play aria-hidden="true" className="size-4" />{running ? "Investigation running…" : "Run Investigation"}</Button></div>
    {snapshot && <Card className="glass mt-5 border-white/[.1]"><CardContent className="p-5 md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.14em] text-[#c5bcff]">IDENTITY TWIN SYNCHRONIZED</p><p className="mt-2 text-sm leading-6 text-slate-200">The Twin now retrieves from this updated Genome version and its direct Identity Knowledge.</p></div><span className="rounded-xl border border-white/[.1] px-3 py-2 font-mono text-[10px] text-slate-400">{snapshot.latestVersion?.version ?? "VERSION NOT RETURNED"}</span></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input value={twinQuestion} onChange={(event) => setTwinQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askTwin(); }} className="h-11 min-w-0 flex-1 rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm text-slate-100 outline-none focus:border-[#b6aaff]/60" /><Button type="button" variant="outline" onClick={askTwin} className="border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><BrainCircuit aria-hidden="true" className="size-4" />Ask Twin</Button></div>{twinAnswer && <p role="status" className="mt-4 rounded-xl border border-[#b1a5ff]/15 bg-[#8b78f6]/[.06] p-4 text-sm leading-6 text-slate-200">{twinAnswer}</p>}</CardContent></Card>}
    {result && <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5"><Card className="glass border-[#b1a5ff]/25"><CardContent className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.15em] text-[#c5bcff]">INVESTIGATION COMPLETE</p><h2 className="mt-2 text-2xl font-semibold text-white">{titleCase(result.investigation.verdict)}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">The backend returned an evidence-backed case, Risk Engine verdict, certificate, and report.</p></div><span className="rounded-xl border border-white/[.1] px-3 py-2 font-mono text-xs text-slate-200">{result.investigation.case_number}</span></div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => setResultView("case")} className="bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><ShieldCheck aria-hidden="true" className="size-4" />Open Case File</Button><Button variant="outline" onClick={() => setResultView("certificate")}>View Certificate</Button><Button variant="outline" onClick={() => setResultView("report")}>View Evidence Report</Button></div></CardContent></Card></motion.div>}
    <InvestigationHistory records={history} onOpen={openHistory} />
  </section>;
}

function VoiceSignalPanel({ duration, language, transcript }: { duration?: number; language?: string; transcript?: string }) {
  const words = transcript ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const wordsPerMinute = duration && duration > 0 && words ? Math.round((words / duration) * 60) : undefined;
  return <Card className="glass mt-5 border-cyan-200/[.12]"><CardContent className="p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><AudioLines aria-hidden="true" className="size-4" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-cyan-200">VOICE EVIDENCE BOUNDARY</p><p className="mt-1 text-sm text-slate-200">Only deterministic, measurable signals are shown.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-4"><Signal label="DURATION" value={duration === undefined ? "Not available" : `${Math.floor(duration / 60)}:${Math.round(duration % 60).toString().padStart(2, "0")}`} /><Signal label="TRANSCRIPT WORDS" value={words ? String(words) : "Not available"} /><Signal label="SPEAKING RATE" value={wordsPerMinute ? `${wordsPerMinute} WPM` : "Not available"} /><Signal label="LANGUAGE" value={language ?? "Not available"} /></div><p className="mt-4 text-xs leading-5 text-slate-500">TrustDNA does not claim speaker verification, voice-clone detection, emotion detection, or lie detection in this workspace.</p></CardContent></Card>;
}

function Signal({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-black/15 p-3"><p className="font-mono text-[9px] tracking-[.11em] text-slate-600">{label}</p><p className="mt-2 text-sm text-slate-200">{value}</p></div>; }

function titleCase(value: string): string { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
