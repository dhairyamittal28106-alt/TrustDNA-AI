"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, BrainCircuit, CircleAlert, Fingerprint, RefreshCw, ShieldCheck } from "lucide-react";
import { IdentityGenomeHologram } from "@/components/identity-genome-hologram";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { buildGenomeSnapshot, emptyGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { buildGenomeHologramSignals } from "@/features/identity-intelligence/hologram-signals";
import { ingestTextIntelligence, IntelligenceApiError, loadGenomeIntelligence } from "@/features/identity-intelligence/api";
import { GenomeInsights } from "@/features/identity-intelligence/components/genome-insights";
import { GenomeTraitSection } from "@/features/identity-intelligence/components/genome-trait-section";
import { IdentityMap } from "@/features/identity-intelligence/components/identity-map";
import { KnowledgeGraph } from "@/features/identity-intelligence/components/knowledge-graph";
import { IdentityFactsPanel } from "@/features/identity-knowledge/components/identity-facts-panel";
import { SkillRadar } from "@/features/identity-intelligence/components/skill-radar";
import { SourceCoverage } from "@/features/identity-intelligence/components/source-coverage";
import { SourceManager } from "@/features/identity-intelligence/components/source-manager";
import { GmailConnectionCard } from "@/features/gmail/components/gmail-connection-card";
import { EvolutionLifecycle } from "@/features/identity-evolution/components/evolution-lifecycle";
import { EvolutionRecommendations } from "@/features/identity-evolution/components/evolution-recommendations";
import { GenomeDiffPanel } from "@/features/identity-evolution/components/genome-diff-panel";
import { GenomeEvolutionTimeline } from "@/features/identity-evolution/components/genome-evolution-timeline";
import { GenomeEvolutionService } from "@/features/identity-evolution/genome-evolution-service";
import { addSessionSource, browserGenomeStore } from "@/features/identity-intelligence/session";
import { finalizeExtractionReport, IdentityKnowledgeExtractor, logExtractionReport } from "@/features/identity-knowledge/identity-knowledge-extractor";
import { KnowledgeLifecycleTracer } from "@/features/identity-knowledge/knowledge-lifecycle-tracer";
import { KnowledgeMerger } from "@/features/identity-knowledge/knowledge-merger";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import type { GenomeSnapshot, SourceRecord } from "@/features/identity-intelligence/types";

const evolutionService = new GenomeEvolutionService();
const knowledgeExtractor = new IdentityKnowledgeExtractor();
const knowledgeMerger = new KnowledgeMerger();
const knowledgeLifecycleTracer = new KnowledgeLifecycleTracer();
const guardianEvents = new GuardianEventBus();

export function IdentityIntelligenceWorkspace() {
  const { user } = useAuth();
  const userId = user?.uid;
  const reduceMotion = useReducedMotion();
  const [snapshot, setSnapshot] = useState<GenomeSnapshot>(() => emptyGenomeSnapshot());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            setError("Your previous analysis session is no longer available. Add a new supported source to continue.");
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
  }, [userId]);

  async function ingestSource(input: { content: string; sourceId: string; sourceLabel: string }) {
    if (!user || !userId) throw new Error("Please sign in before adding an Identity Genome source.");
    setBusy(true);
    setError(null);

    try {
      const previous = browserGenomeStore.load(userId);
      const payload = await ingestTextIntelligence({
        genomeId: previous?.genomeId,
        displayName: user.displayName ?? user.email ?? "TrustDNA member",
        content: input.content,
        sourceLabel: input.sourceLabel,
      });
      const source: SourceRecord = {
        id: `${payload.genome.id}-${payload.profile?.updated_at ?? Date.now()}-${input.sourceId}`,
        sourceId: input.sourceId,
        label: input.sourceLabel,
        status: "ingested",
        origin: "extracted",
        addedAt: payload.profile?.updated_at,
        genomeVersion: payload.profile?.version ?? payload.versions[payload.versions.length - 1]?.version,
      };
      const session = previous?.genomeId === payload.genome.id
        ? addSessionSource(previous, source)
        : { genomeId: payload.genome.id, ownerId: payload.genome.owner_id, sources: [source] };
      browserGenomeStore.save(userId, session);
      const version = payload.profile?.version ?? payload.versions[payload.versions.length - 1]?.version;
      const timestamp = payload.profile?.updated_at ?? payload.versions[payload.versions.length - 1]?.created_at ?? new Date().toISOString();
      const extraction = knowledgeExtractor.extractWithReport({
        content: input.content,
        sourceLabel: input.sourceLabel,
        genomeVersion: version ?? "unversioned",
        timestamp,
      });
      knowledgeLifecycleTracer.trace("extraction", extraction.facts);
      const repositoryBeforeMerge = knowledgeRepository.load(userId);
      knowledgeLifecycleTracer.trace("repository_before_merge", repositoryBeforeMerge);
      const mergedFacts = knowledgeMerger.merge(repositoryBeforeMerge, extraction.facts);
      knowledgeLifecycleTracer.traceMerge(mergedFacts);
      knowledgeRepository.save(userId, mergedFacts.objects);
      const persistedFacts = knowledgeRepository.load(userId);
      knowledgeLifecycleTracer.trace("repository_after_save", persistedFacts);
      logExtractionReport(finalizeExtractionReport(extraction, mergedFacts.objects), input.sourceLabel);
      const nextSnapshot = await buildGenomeSnapshot(payload, session.sources, persistedFacts);
      knowledgeLifecycleTracer.trace("genome_snapshot", nextSnapshot.knowledgeHistory);
      // Question-specific selection remains in the read-only retriever; this
      // stage records the exact immutable history it receives.
      knowledgeLifecycleTracer.trace("retriever_input", nextSnapshot.knowledgeHistory);
      setSnapshot(nextSnapshot);
      evolutionService.synchronize(userId, nextSnapshot);
      guardianEvents.publish("evidence_added", mergedFacts.added.length ? `Learned ${mergedFacts.added.length} new direct Identity Knowledge fact${mergedFacts.added.length === 1 ? "" : "s"}.` : "Updated current Identity Genome evidence.");
    } catch (cause) {
      if (cause instanceof IntelligenceApiError && cause.status === 404) browserGenomeStore.clear(userId);
      const message = cause instanceof Error ? cause.message : "We couldn’t complete the secure analysis. Please try again.";
      setError(message);
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  function scrollToSourceManager() {
    document.getElementById("genome-source-manager")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  if (loading) return <GenomeWorkspaceSkeleton />;

  const heading = snapshot.hasExtractedKnowledge ? "Your living Identity Genome." : "Build the evidence model of you.";
  const evolution = evolutionService.evolve(snapshot);
  const subheading = snapshot.hasExtractedKnowledge
    ? "TrustDNA is showing only the communication evidence it can explain and trace."
    : "Start with a consented text source. TrustDNA will build an explainable foundation—without inventing facts about you.";

  const hologramSignals = buildGenomeHologramSignals(snapshot);
  function focusGenomeEvidence() {
    document.getElementById("identity-facts-heading")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.38 }} className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">IDENTITY INTELLIGENCE ENGINE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">{heading}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{subheading}</p></div><Button onClick={scrollToSourceManager} className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Fingerprint className="size-4" />Add a source <ArrowDown className="size-4" /></Button></motion.div>

    {error && <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-4 text-sm text-amber-50"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="font-medium">Identity intelligence needs your attention</p><p className="mt-1 text-xs leading-5 text-amber-100/75">{error}</p></div></div>}

    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.08, duration: reduceMotion ? 0 : 0.42 }} className="mt-8 grid gap-5 xl:grid-cols-[.78fr_1.22fr]"><IdentityGenomeHologram phase={busy ? "genesis" : snapshot.hasExtractedKnowledge ? "sentinel" : "genome_creation"} identityLabel={user?.displayName ?? "Your Identity Genome"} trustRating={snapshot.hasExtractedKnowledge ? "Evidence-led" : "Assembling"} genomeVersion={snapshot.latestVersion?.version} confidence={snapshot.genomeConfidence} status={busy ? "Synchronizing" : snapshot.hasExtractedKnowledge ? "Evidence linked" : "Knowledge graph assembling"} currentState={busy ? "Guardian is integrating new consented evidence" : evolution.latest?.guardianInsight.observation ?? "Genome Assembly is ready for its first supported source"} signals={hologramSignals} sourceCount={snapshot.sourceCount} knowledgeObjectCount={snapshot.knowledgeHistory.length} lastSynchronized={snapshot.profile?.updated_at ?? snapshot.latestVersion?.created_at} onSignalFocus={focusGenomeEvidence} /><IdentityMap snapshot={snapshot} /></motion.div>

    <div className="mt-5"><SourceManager onIngest={ingestSource} busy={busy} /></div>
    <div className="mt-5"><GmailConnectionCard /></div>

    <div className="mt-5"><EvolutionLifecycle busy={busy} evolution={evolution} /></div>

    <div className="mt-5"><IdentityFactsPanel facts={snapshot.identityFacts} history={snapshot.knowledgeHistory} /></div>

    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.14, duration: reduceMotion ? 0 : 0.42 }} className="mt-5 grid gap-5 xl:grid-cols-2"><SourceCoverage sources={snapshot.sources} /><GenomeInsights insights={snapshot.insights} /></motion.div>

    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.42 }} className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><KnowledgeGraph graph={snapshot.knowledgeGraph} hasExtractedKnowledge={snapshot.hasExtractedKnowledge} /><SkillRadar features={snapshot.features} /></motion.div>

    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : 0.26, duration: reduceMotion ? 0 : 0.42 }} className="mt-5 grid items-start gap-5 xl:grid-cols-[1.15fr_.85fr]"><GenomeEvolutionTimeline evolution={evolution} /><GenomeDiffPanel key={evolution.latest?.version.id ?? "empty"} evolution={evolution} /></motion.div>

    <div className="mt-5"><EvolutionRecommendations recommendations={evolution.recommendations} /></div>

    <section aria-labelledby="genome-sections-heading" className="mt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">EXPLAINABLE KNOWLEDGE</p><h2 id="genome-sections-heading" className="mt-2 text-2xl font-medium text-white">Genome Sections</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Each section shows its confidence, evidence sources, and last update. Missing evidence remains visible as missing—not inferred.</p></div><div className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-white/[.025] px-3 py-2 text-xs text-slate-400"><ShieldCheck aria-hidden="true" className="size-3.5 text-cyan-200" />Evidence over assumptions</div></div><div className="mt-5 grid gap-4">{snapshot.sections.map((section, index) => <GenomeTraitSection key={section.id} section={section} defaultOpen={index < 3} />)}</div></section>

    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#a99bff]/15 bg-[#8d79f7]/[.06] p-5 text-center sm:flex-row sm:text-left"><div><div className="flex items-center justify-center gap-2 sm:justify-start"><BrainCircuit aria-hidden="true" className="size-4 text-[#c4bcff]" /><p className="font-mono text-[10px] tracking-[.14em] text-[#c4bcff]">INTELLIGENCE BOUNDARY</p></div><p className="mt-2 max-w-3xl text-xs leading-5 text-slate-400">Current evidence comes from the deterministic plain-text pipeline. Media analysis, document extractors, connectors, and richer knowledge objects are visible as planned capabilities—not simulated results.</p></div><Button onClick={scrollToSourceManager} variant="outline" className="shrink-0 border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><RefreshCw className="size-4" />Add evidence</Button></div>
  </section>;
}

function GenomeWorkspaceSkeleton() {
  return <section aria-label="Loading Identity Intelligence" className="mx-auto max-w-7xl animate-pulse px-5 py-8 md:px-8 md:py-10"><div className="h-3 w-40 rounded bg-white/[.08]" /><div className="mt-4 h-10 max-w-md rounded bg-white/[.08]" /><div className="mt-3 h-5 max-w-2xl rounded bg-white/[.05]" /><div className="mt-8 grid gap-5 xl:grid-cols-[.78fr_1.22fr]"><div className="h-[31rem] rounded-3xl border border-white/[.06] bg-white/[.035]" /><div className="h-[31rem] rounded-2xl border border-white/[.06] bg-white/[.035]" /></div><div className="mt-5 h-96 rounded-2xl border border-white/[.06] bg-white/[.035]" /></section>;
}
