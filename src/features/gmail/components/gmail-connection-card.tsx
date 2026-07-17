"use client";

import Link from "next/link";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useGmailConnection } from "@/features/gmail/use-gmail-connection";

export function GmailConnectionCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const connection = useGmailConnection(user?.uid);

  const connected = connection?.health === "healthy";
  return <section aria-labelledby="gmail-connection-heading" className={`glass rounded-2xl border p-5 ${connected ? "border-cyan-300/18" : "border-white/[.09]"}`}><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className={`grid size-9 place-items-center rounded-xl ${connected ? "bg-cyan-300/[.1] text-cyan-100" : "bg-[#8d79f7]/[.1] text-[#c8c0ff]"}`}><Mail aria-hidden="true" className="size-4" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#b7aeff]">GMAIL SOURCE</p><h2 id="gmail-connection-heading" className="mt-1 text-base font-medium text-white">{connected ? "Gmail connected" : "Gmail is ready when you are"}</h2></div></div><span className={`rounded-full border px-2 py-1 font-mono text-[8px] tracking-[.11em] ${connected ? "border-cyan-300/20 bg-cyan-300/[.08] text-cyan-100" : "border-white/[.08] bg-white/[.025] text-slate-500"}`}>{connected ? "CONNECTED" : "NOT CONNECTED"}</span></div>{connection ? <dl className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-3"}`}><Metric label="Account" value={connection.email} /><Metric label="Last sync" value={formatDate(connection.lastSyncAt)} /><Metric label="Messages" value={`${connection.messagesAnalyzed} analyzed`} />{!compact && <Metric label="Genome" value={connection.genomeVersion ?? "Awaiting version"} />}</dl> : <p className="mt-3 text-xs leading-5 text-slate-500">Connect with Google to analyze your sent emails using Gmail read-only permission. TrustDNA never asks to send, edit, or delete mail.</p>}<div className="mt-4 flex items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-[10px] leading-4 text-slate-500"><ShieldCheck aria-hidden="true" className="size-3.5 text-slate-500" />Read-only consent · Refresh requires reauthorization</p><Link href="/gmail" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#c3bbff] transition hover:text-white">{connected ? "Manage Gmail" : "Connect Gmail"}<CheckCircle2 aria-hidden="true" className="size-3.5" /></Link></div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] tracking-[.12em] text-slate-600">{label.toUpperCase()}</dt><dd className="mt-1 truncate text-[11px] font-medium text-slate-200">{value}</dd></div>;
}

function formatDate(value: string | undefined): string {
  if (!value) return "Not synced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
