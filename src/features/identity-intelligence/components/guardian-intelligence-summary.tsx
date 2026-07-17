"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, BrainCircuit, Database, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { loadGenomeIntelligence } from "@/features/identity-intelligence/api";
import { ProvenanceBadge } from "@/features/identity-intelligence/components/provenance-badge";
import { browserGenomeStore } from "@/features/identity-intelligence/session";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";

type SummaryState =
  | { kind: "loading" }
  | { kind: "empty"; snapshot: GenomeSnapshot }
  | { kind: "ready"; snapshot: GenomeSnapshot }
  | { kind: "error" };

export function GuardianIntelligenceSummary() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SummaryState>({ kind: "loading" });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      if (authLoading) return;

      setState({ kind: "loading" });

      if (!user) {
        const snapshot = await buildGenomeSnapshot(undefined, []);
        if (active) setState({ kind: "empty", snapshot });
        return;
      }

      const session = browserGenomeStore.load(user.uid);
      if (!session) {
        const snapshot = await buildGenomeSnapshot(undefined, []);
        if (active) setState({ kind: "empty", snapshot });
        return;
      }

      try {
        const payload = await loadGenomeIntelligence(session.genomeId);
        const snapshot = await buildGenomeSnapshot(payload, session.sources, knowledgeRepository.load(user.uid));
        if (!active) return;
        setState({ kind: snapshot.hasExtractedKnowledge ? "ready" : "empty", snapshot });
      } catch {
        if (active) setState({ kind: "error" });
      }
    }

    void loadSummary();
    return () => {
      active = false;
    };
  }, [authLoading, refreshKey, user]);

  return (
    <section
      aria-labelledby="guardian-intelligence-summary-heading"
      className="glass overflow-hidden rounded-2xl border border-white/[.09] bg-[#0a0d22]/75"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/[.07] px-5 py-4">
        <div>
          <p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">GUARDIAN INTELLIGENCE</p>
          <h2 id="guardian-intelligence-summary-heading" className="mt-1.5 text-lg font-medium text-white">
            Evidence-aware identity signals
          </h2>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#a99bff]/20 bg-[#8e7af6]/10 text-[#c4bcff]">
          <BrainCircuit aria-hidden="true" className="size-4.5" />
        </span>
      </div>

      <div className="p-5">
        {state.kind === "loading" && <LoadingSummary />}
        {state.kind === "empty" && <EmptySummary snapshot={state.snapshot} />}
        {state.kind === "ready" && <ReadySummary snapshot={state.snapshot} />}
        {state.kind === "error" && <ErrorSummary onRetry={() => setRefreshKey((current) => current + 1)} />}
      </div>
    </section>
  );
}

function LoadingSummary() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="size-8 animate-pulse rounded-lg bg-[#8e7af6]/12" />
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-3 w-36 animate-pulse rounded bg-white/[.08]" />
          <span className="block h-2.5 w-52 max-w-full animate-pulse rounded bg-white/[.05]" />
        </div>
      </div>
      <div className="space-y-2 rounded-xl border border-white/[.06] bg-black/10 p-4">
        <span className="block h-3 w-4/5 animate-pulse rounded bg-white/[.07]" />
        <span className="block h-2.5 w-full animate-pulse rounded bg-white/[.04]" />
        <span className="block h-2.5 w-3/5 animate-pulse rounded bg-white/[.04]" />
      </div>
      <p className="sr-only">Loading Guardian intelligence.</p>
    </div>
  );
}

function EmptySummary({ snapshot }: { snapshot: GenomeSnapshot }) {
  const insight = snapshot.insights[0];
  const hasActiveGenome = Boolean(snapshot.genome);

  return (
    <div className="rounded-xl border border-dashed border-white/[.12] bg-black/10 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[.04] text-slate-500">
          <ShieldCheck aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-200">
              {hasActiveGenome ? "Guardian awaiting supported text evidence" : "Guardian awaiting an active genome"}
            </p>
            {insight && <ProvenanceBadge origin={insight.origin} />}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {insight?.detail ?? "Add a supported, consented text source before Guardian intelligence can surface evidence-linked signals."}
          </p>
        </div>
      </div>
      <Link
        href="/genome"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#beb5ff] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c8dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07091b]"
      >
        {hasActiveGenome ? "Add identity evidence" : "Build Identity Genome"}
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}

function ReadySummary({ snapshot }: { snapshot: GenomeSnapshot }) {
  const insights = snapshot.insights.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Database}
          label="Analyzed sources"
          value={String(snapshot.sourceCount)}
          detail="Current genome evidence"
        />
        <Metric
          icon={ShieldCheck}
          label="Genome confidence"
          value={snapshot.genomeConfidence === undefined ? "â€”" : `${snapshot.genomeConfidence}%`}
          detail={snapshot.latestVersion ? `Version ${snapshot.latestVersion.version}` : "No version recorded"}
        />
      </div>

      <ul aria-label="Guardian intelligence insights" className="space-y-2.5">
        {insights.map((insight) => (
          <li key={insight.id} className="rounded-xl border border-white/[.07] bg-black/15 p-3.5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#8e7af6]/12 text-[#c4bcff]">
                <Sparkles aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-slate-100">{insight.title}</p>
                  <ProvenanceBadge origin={insight.origin} />
                </div>
                <p className="mt-1.5 text-[11px] leading-5 text-slate-400">{insight.detail}</p>
                {insight.updatedAt && (
                  <time dateTime={insight.updatedAt} className="mt-2 block font-mono text-[9px] tracking-[.1em] text-slate-600">
                    {formatTimestamp(insight.updatedAt)}
                  </time>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/genome"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#beb5ff] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c8dff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07091b]"
      >
        View Intelligence Map
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}

function ErrorSummary({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-4">
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" />
        <div>
          <p className="text-sm font-medium text-slate-200">Guardian intelligence is temporarily unavailable</p>
          <p className="mt-1.5 text-xs leading-5 text-slate-500">Your existing Identity Genome has not been changed.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amber-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07091b]"
      >
        <RefreshCw aria-hidden="true" className="size-3.5" />
        Try again
      </button>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-white/[.07] bg-black/10 p-3">
      <Icon aria-hidden="true" className="size-3.5 text-[#b9afff]" />
      <p className="mt-3 font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</p>
      <p className="mt-1 text-base font-medium text-white">{value}</p>
      <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
    </div>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
