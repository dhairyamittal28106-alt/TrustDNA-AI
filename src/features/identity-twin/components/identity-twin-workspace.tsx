"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Fingerprint, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { buildGenomeSnapshot, emptyGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { IntelligenceApiError, loadGenomeIntelligence } from "@/features/identity-intelligence/api";
import { browserGenomeStore } from "@/features/identity-intelligence/session";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import { TwinSynchronizationService } from "@/features/identity-evolution/twin-synchronization-service";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import { TwinConversation } from "@/features/identity-twin/components/twin-conversation";
import { TwinEvidencePanel } from "@/features/identity-twin/components/twin-evidence-panel";
import { TwinReasoningPanel } from "@/features/identity-twin/components/twin-reasoning-panel";
import { IdentityReasoningTrace } from "@/features/identity-reasoning/components/identity-reasoning-trace";
import { IdentityTwinService } from "@/features/identity-twin/service";
import type { TwinConversationMessage, TwinGuardianState, TwinResponse } from "@/features/identity-twin/types";

const twinService = new IdentityTwinService();
const twinSynchronizationService = new TwinSynchronizationService();
const guardianEvents = new GuardianEventBus();
const suggestedQuestions = [
  "Who am I?",
  "What's my dream?",
  "What skills do I have?",
  "Which university do I attend?",
  "Who is my favorite cricketer?",
  "Would I make a good entrepreneur?",
  "What motivates me?",
  "Should I pursue higher studies?",
  "How do I become more disciplined?",
  "Does this email sound like me?",
];

const initialMessages: TwinConversationMessage[] = [{
  id: "twin-greeting",
  role: "twin",
  content: "I’m your evidence-bound Identity Twin. I can answer direct Identity Facts and offer structured decision support from your stored evidence, while keeping missing evidence, alternative views, and limits visible.",
}];

export function IdentityTwinWorkspace() {
  const { user } = useAuth();
  const userId = user?.uid;
  const reduceMotion = useReducedMotion();
  const timeouts = useRef<number[]>([]);
  const [snapshot, setSnapshot] = useState<GenomeSnapshot>(() => emptyGenomeSnapshot());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<TwinConversationMessage[]>(initialMessages);
  const [selectedResponse, setSelectedResponse] = useState<TwinResponse>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [guardianState, setGuardianState] = useState<TwinGuardianState>("listening");
  const [activePipelineStage, setActivePipelineStage] = useState(-1);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (!userId) {
          if (active) {
            setSnapshot(emptyGenomeSnapshot());
            setLoading(false);
          }
          return;
        }

        const session = browserGenomeStore.load(userId);
        if (!session) {
          if (active) {
            setSnapshot(emptyGenomeSnapshot());
            setError(null);
            setLoading(false);
          }
          return;
        }

        try {
          const payload = await loadGenomeIntelligence(session.genomeId);
          const nextSnapshot = await buildGenomeSnapshot(payload, session.sources, knowledgeRepository.load(userId));
          if (active) {
            setSnapshot(nextSnapshot);
            setError(null);
          }
        } catch (cause) {
          if (cause instanceof IntelligenceApiError && cause.status === 404) browserGenomeStore.clear(userId);
          if (active) {
            setSnapshot(emptyGenomeSnapshot());
            setError("Your current Identity Genome could not be loaded. Add a supported source or try again.");
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadAttempt, userId]);

  useEffect(() => () => {
    timeouts.current.forEach((timeout) => window.clearTimeout(timeout));
  }, []);

  useEffect(() => {
    if (!userId) return;
    return twinSynchronizationService.subscribe(userId, () => {
      setLoading(true);
      setError(null);
      setLoadAttempt((attempt) => attempt + 1);
    });
  }, [userId]);

  function queueTimeout(callback: () => void, delay: number) {
    const timeout = window.setTimeout(callback, delay);
    timeouts.current.push(timeout);
  }

  function handleSubmit() {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion || isProcessing) return;

    const response = twinService.answer(normalizedQuestion, snapshot);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: normalizedQuestion }]);
    setQuestion("");
    setSelectedResponse(response);
    setIsProcessing(true);
    setActivePipelineStage(0);
    setGuardianState("thinking");
    guardianEvents.publish("twin_thinking", thinkingDetail(response.intent));
    runEvidenceTrace(response, 0);
  }

  function handleSuggestedQuestion(value: string) {
    if (isProcessing) return;
    setQuestion(value);
    const response = twinService.answer(value, snapshot);
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", content: value }]);
    setQuestion("");
    setSelectedResponse(response);
    setIsProcessing(true);
    setActivePipelineStage(0);
    setGuardianState("thinking");
    guardianEvents.publish("twin_thinking", thinkingDetail(response.intent));
    runEvidenceTrace(response, 0);
  }

  function runEvidenceTrace(response: TwinResponse, stageIndex: number) {
    const lastStage = response.pipeline.length - 1;
    setActivePipelineStage(stageIndex);
    setGuardianState(stageIndex < 2 ? "thinking" : stageIndex < lastStage ? "reasoning" : "answer_ready");

    if (stageIndex >= lastStage) {
      queueTimeout(() => {
        setMessages((current) => [...current, { id: response.id, role: "twin", content: response.answer, response }]);
        setIsProcessing(false);
        setGuardianState("answer_ready");
        const withheld = response.intent === "prediction_boundary" || response.confidence === null && !response.hybridAdvice;
        guardianEvents.publish(withheld ? "unknown_question" : "twin_answered", withheld ? "No direct knowledge object supports that question yet." : "Identity Twin completed an evidence-bound response.");
      }, reduceMotion ? 0 : 380);
      return;
    }

    queueTimeout(() => runEvidenceTrace(response, stageIndex + 1), reduceMotion ? 0 : 220);
  }

  function retryLoading() {
    setLoading(true);
    setError(null);
    setLoadAttempt((attempt) => attempt + 1);
  }

  if (loading) return <TwinWorkspaceSkeleton />;

  const identityLabel = user?.displayName ?? user?.email?.split("@")[0] ?? "Your Identity Genome";

  return <section className="mx-auto max-w-[96rem] px-5 py-8 md:px-8 md:py-10">
    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .35 }} className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">IDENTITY TWIN INTELLIGENCE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Your evidence-bound Identity Twin.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">A structured reasoning layer that retrieves only your consented Identity Genome evidence—then makes its confidence, limits, and evidence trace visible.</p></div>
      <div className="flex flex-wrap items-center gap-2"><TwinGenomeVersion snapshot={snapshot} /><div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] px-3 py-2 text-xs text-cyan-100"><Sparkles aria-hidden="true" className="size-3.5" />No invented memories</div></div>
    </motion.div>
    {error && <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-4 text-sm text-amber-50"><div className="flex items-start gap-3"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="font-medium">Identity Twin needs attention</p><p className="mt-1 text-xs leading-5 text-amber-100/75">{error}</p></div></div><Button type="button" onClick={retryLoading} variant="outline" className="border-amber-200/20 bg-transparent text-amber-50 hover:bg-amber-200/[.08] hover:text-white"><RefreshCw aria-hidden="true" className="size-3.5" />Try again</Button></div>}
    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : .08, duration: reduceMotion ? 0 : .4 }} className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(17rem,.78fr)_minmax(17rem,.72fr)]"><TwinConversation messages={messages} question={question} isProcessing={isProcessing} hasEvidence={snapshot.hasExtractedKnowledge} suggestedQuestions={suggestedQuestions} onQuestionChange={setQuestion} onSubmit={handleSubmit} onSuggestedQuestion={handleSuggestedQuestion} /><TwinReasoningPanel response={selectedResponse} snapshot={snapshot} guardianState={guardianState} activePipelineStage={activePipelineStage} isProcessing={isProcessing} identityLabel={identityLabel} /><TwinEvidencePanel response={selectedResponse} snapshot={snapshot} /></motion.div>
    <IdentityReasoningTrace reasoning={selectedResponse?.identityReasoning} />
    {!snapshot.hasExtractedKnowledge && <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#a99bff]/15 bg-[#8d79f7]/[.06] p-5 text-center sm:flex-row sm:text-left"><div><div className="flex items-center justify-center gap-2 sm:justify-start"><Fingerprint aria-hidden="true" className="size-4 text-[#c4bcff]" /><p className="font-mono text-[10px] tracking-[.14em] text-[#c4bcff]">TWIN EVIDENCE BOUNDARY</p></div><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">The Twin will not infer your goals, skills, relationships, or identity from a blank profile. Add a consented text source to unlock explainable communication evidence.</p></div><Button asChild variant="outline" className="shrink-0 border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><Link href="/genome">Add Identity Genome evidence</Link></Button></div>}
  </section>;
}

function thinkingDetail(intent: TwinResponse["intent"]): string {
  if (intent === "hybrid_advice") return "Separating Identity Evidence from general guidance.";
  if (intent === "prediction_boundary") return "Preserving the Identity Twin’s future-prediction boundary.";
  if (intent === "identity_reasoning") return "Correlating current Identity Profile evidence for decision support.";
  return "Retrieving structured Identity Knowledge for your question.";
}

function TwinGenomeVersion({ snapshot }: { snapshot: GenomeSnapshot }) {
  const version = snapshot.latestVersion?.version ?? "Awaiting version";
  const updatedAt = snapshot.profile?.updated_at ?? snapshot.latestVersion?.created_at;
  return <dl className="grid grid-cols-3 divide-x divide-white/[.07] overflow-hidden rounded-xl border border-white/[.09] bg-black/[.12] text-left"><TwinVersionMetric label="Reasoning with" value={version} /><TwinVersionMetric label="Coverage" value={snapshot.genomeConfidence === undefined ? "Unknown" : `${snapshot.genomeConfidence}%`} /><TwinVersionMetric label="Updated" value={formatSyncTime(updatedAt)} /></dl>;
}

function TwinVersionMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-20 px-3 py-2"><dt className="font-mono text-[8px] tracking-[.1em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[10px] font-medium text-slate-200">{value}</dd></div>;
}

function formatSyncTime(value: string | undefined): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function TwinWorkspaceSkeleton() {
  return <section aria-label="Loading Identity Twin" className="mx-auto max-w-[96rem] animate-pulse px-5 py-8 md:px-8 md:py-10"><div className="h-3 w-48 rounded bg-white/[.08]" /><div className="mt-4 h-10 max-w-xl rounded bg-white/[.08]" /><div className="mt-3 h-5 max-w-3xl rounded bg-white/[.05]" /><div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(17rem,.78fr)_minmax(17rem,.72fr)]"><div className="h-[42rem] rounded-[1.75rem] border border-white/[.06] bg-white/[.035]" /><div className="h-[42rem] rounded-[1.5rem] border border-white/[.06] bg-white/[.035]" /><div className="h-[42rem] rounded-[1.5rem] border border-white/[.06] bg-white/[.035]" /></div></section>;
}
