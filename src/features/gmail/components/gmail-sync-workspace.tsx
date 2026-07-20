"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, CircleAlert, CloudCog, KeyRound, Link2Off, LoaderCircle, LockKeyhole, Mail, RefreshCw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import { addSessionSource, browserGenomeStore } from "@/features/identity-intelligence/session";
import type { SourceRecord } from "@/features/identity-intelligence/types";
import { GenomeEvolutionService } from "@/features/identity-evolution/genome-evolution-service";
import { knowledgeRepository } from "@/features/identity-knowledge/knowledge-repository";
import { IdentityKnowledgeExtractor } from "@/features/identity-knowledge/identity-knowledge-extractor";
import { KnowledgeMerger } from "@/features/identity-knowledge/knowledge-merger";
import { GuardianEventBus } from "@/features/guardian/guardian-event-bus";
import { syncGmail, GmailSyncApiError } from "@/features/gmail/api";
import { GmailConnector, GmailConnectorError } from "@/features/gmail/gmail-connector";
import { gmailConnectionStore } from "@/features/gmail/session";
import type { GmailSyncResult } from "@/features/gmail/types";
import { useGmailConnection } from "@/features/gmail/use-gmail-connection";

const gmailConnector = new GmailConnector();
const evolutionService = new GenomeEvolutionService();
const guardianEvents = new GuardianEventBus();
const knowledgeExtractor = new IdentityKnowledgeExtractor();
const knowledgeMerger = new KnowledgeMerger();
const subscribeToAvailability = () => () => undefined;

export function GmailSyncWorkspace() {
  const { user } = useAuth();
  const userId = user?.uid;
  const reduceMotion = useReducedMotion();
  const connection = useGmailConnection(userId);
  const [latestSync, setLatestSync] = useState<GmailSyncResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success" | "info"; message: string } | null>(null);
  const available = useSyncExternalStore(subscribeToAvailability, () => gmailConnector.isAvailable(), () => false);

  async function connectAndSync() {
    if (!user || !userId || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const authorization = await gmailConnector.authorizeReadOnly();
      const result = await syncGmail({
        accessToken: authorization.accessToken,
        genomeId: browserGenomeStore.load(userId)?.genomeId,
        displayName: user.displayName ?? user.email ?? "TrustDNA member",
      });
      const consentedText = await gmailConnector.readSentMessageText(authorization.accessToken, result.summary.messagesAnalyzed);
      await persistSync(result, authorization.email, consentedText);
      setNotice({ tone: "success", message: `Gmail sync complete. ${result.summary.messagesAnalyzed} sent messages created Genome ${result.profile?.version ?? result.versions.at(-1)?.version ?? "update"}.` });
    } catch (error) {
      if (userId && connection && requiresReauthorization(error)) {
        gmailConnectionStore.save(userId, {
          ...connection,
          health: "needs_reauthorization",
        });
      } else if (userId && connection && error instanceof GmailSyncApiError) {
        gmailConnectionStore.save(userId, { ...connection, health: "error" });
      }
      setNotice({ tone: "error", message: friendlySyncError(error) });
    } finally {
      setBusy(false);
    }
  }

  async function persistSync(result: GmailSyncResult, email: string, consentedText: string) {
    if (!userId) return;
    const previous = browserGenomeStore.load(userId);
    const source: SourceRecord = {
      id: `${result.genome.id}-${result.summary.syncedAt}-gmail`,
      sourceId: "gmail",
      label: `Gmail · ${email}`,
      status: "ingested",
      origin: "extracted",
      addedAt: result.summary.syncedAt,
      genomeVersion: result.profile?.version ?? result.versions.at(-1)?.version,
    };
    const session = previous?.genomeId === result.genome.id
      ? addSessionSource(previous, source)
      : { genomeId: result.genome.id, ownerId: result.genome.owner_id, sources: [source] };
    browserGenomeStore.save(userId, session);
    const version = result.profile?.version ?? result.versions.at(-1)?.version ?? "unversioned";
    const timestamp = result.summary.syncedAt;
    const extractedFacts = knowledgeExtractor.extract({
      content: consentedText,
      sourceLabel: source.label,
      genomeVersion: version,
      timestamp,
    });
    const mergedFacts = knowledgeMerger.merge(knowledgeRepository.load(userId), extractedFacts);
    knowledgeRepository.save(userId, mergedFacts.objects);
    const snapshot = await buildGenomeSnapshot(result, session.sources, knowledgeRepository.load(userId));
    evolutionService.synchronize(userId, snapshot);
    guardianEvents.publish("gmail_sync", `Analyzed ${result.summary.messagesAnalyzed} consented sent Gmail message${result.summary.messagesAnalyzed === 1 ? "" : "s"}.`);
    gmailConnectionStore.save(userId, {
      email,
      connectedAt: connection?.connectedAt ?? result.summary.syncedAt,
      lastSyncAt: result.summary.syncedAt,
      messagesAnalyzed: result.summary.messagesAnalyzed,
      genomeId: result.genome.id,
      genomeVersion: result.profile?.version ?? result.versions.at(-1)?.version,
      health: "healthy",
    });
    setLatestSync(result);
  }

  function disconnect() {
    if (!userId) return;
    gmailConnectionStore.clear(userId);
    setLatestSync(null);
    setNotice({ tone: "success", message: "Gmail connection metadata was removed. TrustDNA does not retain a Gmail OAuth token. Existing evidence-backed Genome versions remain available." });
  }

  function explainDeletionBoundary() {
    setNotice({ tone: "info", message: "Selective Gmail-evidence deletion is not active yet because the current backend does not support source-level Genome retraction. Disconnect stops future Gmail access immediately; no Gmail token is retained." });
  }

  const connected = connection?.health === "healthy";
  const hasConnection = Boolean(connection);
  const currentVersion = connection?.genomeVersion ?? latestSync?.profile?.version ?? latestSync?.versions.at(-1)?.version;

  return <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"><motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .35 }} className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">GMAIL IDENTITY SOURCE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Learn from the emails you choose.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">TrustDNA reads only sent messages using Gmail read-only consent, extracts explainable communication signals, and creates a new Identity Genome version for each sync.</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] px-3 py-2 text-xs text-cyan-100"><LockKeyhole aria-hidden="true" className="size-3.5" />READ-ONLY ACCESS</span></motion.div>

    {!available && <UnavailableState />}
    {notice && <Notice tone={notice.tone} message={notice.message} />}

    <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : .08, duration: reduceMotion ? 0 : .4 }} className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="glass rounded-[1.75rem] border border-white/[.1] p-6"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b8afff]">CONNECTION STATUS</p><h2 className="mt-2 text-xl font-medium text-white">{connected ? "Gmail is connected" : hasConnection ? "Gmail needs your attention" : "Connect Gmail securely"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{connected ? "Refresh when you want to analyze a new consented batch. Google reauthorization is requested each time because TrustDNA does not persist Gmail OAuth tokens." : hasConnection ? "Reauthorize Gmail to continue the consented sync, or disconnect this local connection record at any time." : "Google asks only for Gmail read-only access. TrustDNA never sends, edits, or deletes email."}</p></div><span className={`grid size-11 place-items-center rounded-2xl ${connected ? "bg-cyan-300/[.1] text-cyan-100" : "bg-[#8d79f7]/[.12] text-[#c7c0ff]"}`}><Mail aria-hidden="true" className="size-5" /></span></div><dl className="mt-7 grid gap-4 sm:grid-cols-2"><StatusMetric label="Status" value={connected ? "Connected" : hasConnection ? "Action required" : available ? "Not connected" : "Unavailable"} /><StatusMetric label="Connection health" value={connection ? connection.health.replaceAll("_", " ") : "Needs consent"} /><StatusMetric label="Last sync" value={formatDate(connection?.lastSyncAt)} /><StatusMetric label="Messages analyzed" value={`${connection?.messagesAnalyzed ?? 0}`} /><StatusMetric label="Current Genome" value={currentVersion ?? "Awaiting first sync"} /><StatusMetric label="Account" value={connection?.email ?? "Not linked"} /></dl><div className="mt-7 flex flex-wrap gap-3"><Button type="button" onClick={connectAndSync} disabled={!available || busy} className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]">{busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : hasConnection ? <RefreshCw aria-hidden="true" className="size-4" /> : <Mail aria-hidden="true" className="size-4" />}{busy ? "Synchronizing Gmail…" : hasConnection ? "Reauthorize & refresh" : "Connect Gmail"}</Button>{hasConnection && <Button type="button" onClick={disconnect} disabled={busy} variant="outline" className="h-11 border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.06] hover:text-white"><Link2Off aria-hidden="true" className="size-4" />Disconnect</Button>}</div></section><SecurityPanel /></motion.div>

    <section aria-labelledby="gmail-sync-pipeline" className="glass mt-5 rounded-2xl border border-white/[.09] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b6acff]">LIVING IDENTITY SYNCHRONIZATION</p><h2 id="gmail-sync-pipeline" className="mt-2 text-xl font-medium text-white">Every real sync creates evidence.</h2><p className="mt-2 text-xs leading-5 text-slate-400">No emails are fabricated. A new version is created only after Gmail returns readable sent-message content and the existing Identity Genome pipeline completes.</p></div><CloudCog aria-hidden="true" className={`size-5 text-[#b6acff] ${busy ? "animate-pulse" : ""}`} /></div><ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{syncSteps.map((step, index) => <li key={step.title} className={`rounded-xl border p-3 ${busy && index === 0 ? "border-[#b8adff]/30 bg-[#8d79f7]/[.08]" : latestSync ? "border-cyan-300/12 bg-cyan-300/[.035]" : "border-white/[.06] bg-black/[.08]"}`}><div className="flex items-center gap-2">{latestSync && !busy ? <CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" /> : busy && index === 0 ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin text-[#c7c0ff]" /> : <span aria-hidden="true" className="size-3.5 rounded-full border border-slate-600" />}<p className="text-xs font-medium text-slate-200">{step.title}</p></div><p className="mt-2 text-[11px] leading-4 text-slate-500">{step.detail}</p></li>)}</ol></section>

    {latestSync && <SyncResults result={latestSync} />}

    <section className="mt-5 grid gap-5 lg:grid-cols-2"><section className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-4 text-cyan-200" /><h2 className="text-base font-medium text-white">Your Gmail controls</h2></div><p className="mt-3 text-xs leading-5 text-slate-400">Disconnect removes TrustDNA’s browser-session connection record. Gmail tokens are never stored. Existing evidence-backed Genome versions stay visible so their impact remains explainable.</p><button type="button" onClick={explainDeletionBoundary} className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-amber-100 transition hover:text-white"><Trash2 aria-hidden="true" className="size-3.5" />About deleting imported Gmail evidence</button></section><section className="glass rounded-2xl border border-white/[.09] p-5"><div className="flex items-center gap-2"><Sparkles aria-hidden="true" className="size-4 text-[#c7c0ff]" /><h2 className="text-base font-medium text-white">Identity Twin synchronization</h2></div><p className="mt-3 text-xs leading-5 text-slate-400">After a successful Gmail sync, the Guardian records the new Genome version and the Identity Twin refreshes against that latest evidence boundary.</p><Link href="/twin" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#c3bbff] hover:text-white">Open Identity Twin <KeyRound aria-hidden="true" className="size-3.5" /></Link></section></section>
  </section>;
}

const syncSteps = [
  { title: "Retrieve sent messages", detail: "Gmail API returns only the consented sent-email batch." },
  { title: "Extract communication text", detail: "Plain-text bodies are normalized; quoted lines are excluded where identifiable." },
  { title: "Update Identity Genome", detail: "Existing deterministic analysis updates the current/latest text feature snapshot." },
  { title: "Create Genome version", detail: "The backend stores the Gmail source label and deterministic version metadata." },
  { title: "Guardian observation", detail: "A stored evidence-backed version summary is produced." },
  { title: "Refresh Identity Twin", detail: "The current Twin receives the latest Genome-version signal." },
] as const;

function StatusMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-black/[.1] p-3"><dt className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-xs font-medium text-slate-200">{value}</dd></div>;
}

function SecurityPanel() {
  return <aside className="glass rounded-[1.75rem] border border-cyan-300/[.12] bg-cyan-300/[.025] p-6"><div className="grid size-11 place-items-center rounded-2xl bg-cyan-300/[.1] text-cyan-100"><LockKeyhole aria-hidden="true" className="size-5" /></div><p className="mt-6 font-mono text-[10px] tracking-[.16em] text-cyan-100">CONSENT & SECURITY</p><h2 className="mt-2 text-xl font-medium text-white">Gmail is read-only by design.</h2><ul className="mt-5 space-y-4">{["Only the Gmail read-only OAuth scope is requested.", "TrustDNA reads sent messages for communication evidence; it cannot send, edit, or delete email.", "OAuth tokens remain in memory for the sync request and are never written to browser storage.", "Disconnect anytime to remove the connection record and stop future Gmail syncs."].map((item) => <li key={item} className="flex gap-3 text-xs leading-5 text-slate-400"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-cyan-200" />{item}</li>)}</ul></aside>;
}

function SyncResults({ result }: { result: GmailSyncResult }) {
  return <section aria-labelledby="gmail-sync-results" className="glass mt-5 rounded-2xl border border-cyan-300/14 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-cyan-100">SYNC COMPLETE</p><h2 id="gmail-sync-results" className="mt-2 text-xl font-medium text-white">Gmail evidence added to your Genome.</h2><p className="mt-2 text-xs leading-5 text-slate-400">{result.summary.messagesAnalyzed} sent messages and {result.summary.charactersAnalyzed.toLocaleString()} characters were analyzed through the deterministic text pipeline.</p></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[.08] px-2.5 py-1 font-mono text-[9px] tracking-[.12em] text-cyan-100">{result.profile?.version ?? result.versions.at(-1)?.version ?? "VERSION CREATED"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-white/[.07] bg-black/[.1] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">GUARDIAN OBSERVATION</p><p className="mt-2 text-xs leading-5 text-slate-300">{result.versions.at(-1)?.guardian_observation ?? "Genome version recorded from Gmail evidence."}</p></div><div className="rounded-xl border border-white/[.07] bg-black/[.1] p-3"><p className="font-mono text-[8px] tracking-[.12em] text-slate-600">REPEATED PHRASES</p><p className="mt-2 text-xs leading-5 text-slate-300">{result.summary.frequentPhrases.length ? result.summary.frequentPhrases.join(" · ") : "No phrase repeated often enough in this batch to report."}</p></div></div></section>;
}

function UnavailableState() {
  return <div role="status" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/15 bg-amber-200/[.06] p-4 text-sm text-amber-50"><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="font-medium">Gmail connection is unavailable in this environment</p><p className="mt-1 text-xs leading-5 text-amber-100/75">Configure Firebase Authentication, add this domain to Firebase authorized domains, enable the Gmail API in the matching Google Cloud project, and try again. TrustDNA will not simulate an inbox while any requirement is missing.</p></div></div>;
}

function Notice({ tone, message }: { tone: "error" | "success" | "info"; message: string }) {
  const styles = { error: "border-rose-300/20 bg-rose-300/[.07] text-rose-100", success: "border-cyan-300/20 bg-cyan-300/[.07] text-cyan-100", info: "border-amber-300/20 bg-amber-300/[.07] text-amber-100" };
  return <div role="status" className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${styles[tone]}`}><CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p className="text-xs leading-5">{message}</p></div>;
}

function friendlySyncError(error: unknown): string {
  if (requiresReauthorization(error)) return "Gmail permission needs to be re-authorized.";
  if (error instanceof GmailConnectorError || error instanceof GmailSyncApiError) return error.message;
  return "Gmail could not be synchronized. No Identity Genome update was created.";
}

function requiresReauthorization(error: unknown): boolean {
  return (error instanceof GmailSyncApiError && (error.code === "GMAIL_AUTH_EXPIRED" || error.code === "GMAIL_PERMISSION_DENIED"))
    || (error instanceof GmailConnectorError && error.code === "GMAIL_SCOPE_MISSING");
}

function formatDate(value: string | undefined): string {
  if (!value) return "Not synced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
