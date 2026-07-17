import {
  ArrowLeft,
  BarChart3,
  Check,
  CircleDotDashed,
  Clock3,
  Download,
  FileText,
  Fingerprint,
  Radar,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AgentResult, InvestigationResult } from "@/features/judge/types";

type EvidenceReportProps = {
  result: InvestigationResult;
  onReturnToCaseFile: () => void;
  onStartNewInvestigation: () => void;
  onViewCertificate: () => void;
};

const timelineLabels: Record<string, string> = {
  case_created: "Sentinel opened the case",
  collecting_evidence: "Evidence collected and artifact classified",
  dispatching_agents: "Forensic agents dispatched",
  awaiting_results: "Specialist evidence returned",
  aggregating: "Evidence correlated",
  risk_analysis: "Risk Engine assessed the case",
  generating_findings: "Findings compiled",
  generating_certificate: "TrustDNA Certificate generated",
  closed: "Verdict issued and case closed",
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC", timeZoneName: "short" }).format(new Date(value));
}

function duration(result: InvestigationResult) {
  const startedAt = result.investigation.timeline[0]?.occurred_at;
  const finishedAt = result.investigation.timeline.at(-1)?.occurred_at;
  if (!startedAt || !finishedAt) return "Not available";
  const elapsed = Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());
  return elapsed < 1_000 ? "< 1 second" : `${(elapsed / 1_000).toFixed(1)} seconds`;
}

function exportReport(result: InvestigationResult) {
  const lines = [
    "TrustDNA AI — Digital Forensics Evidence Report",
    `Case: ${result.investigation.case_number}`,
    `Investigation: ${result.investigation.id}`,
    `Verdict: ${titleCase(result.investigation.verdict)}`,
    `Risk: ${result.investigation.risk_level}`,
    `Confidence: ${Math.round(result.risk.confidence * 100)}%`,
    `Certificate: ${result.certificate.certificate_number}`,
    "",
    "Evidence:",
    ...result.agents.flatMap((agent) => agent.evidence.map((evidence) => `- ${titleCase(evidence.code)} | ${evidence.category} | ${Math.round(evidence.weight * 100)}% | ${evidence.source_reference}`)),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${result.investigation.case_number.toLowerCase()}-evidence-report.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function EvidenceReport({ result, onReturnToCaseFile, onStartNewInvestigation, onViewCertificate }: EvidenceReportProps) {
  const { investigation, risk, certificate, agents } = result;
  const riskScore = Math.round(risk.breakdown.weighted_score * 100);
  const identityMatch = Math.max(0, 100 - riskScore);
  const evidence = agents.flatMap((agent) => agent.evidence.map((item) => ({ ...item, agent })));
  const findingsByEvidence = new Map(agents.flatMap((agent) => agent.findings.flatMap((finding) => finding.evidence_codes.map((code) => [code, finding]))));
  const groupedEvidence = Object.entries(evidence.reduce<Record<string, typeof evidence>>((groups, item) => {
    (groups[item.category] ??= []).push(item);
    return groups;
  }, {}));
  const highRisk = investigation.risk_level === "high" || investigation.risk_level === "critical";

  return (
    <section id="evidence-report" aria-labelledby="report-title" className="mx-auto w-full max-w-7xl scroll-mt-6 px-5 py-12 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">DIGITAL FORENSICS EVIDENCE REPORT</p><h2 id="report-title" className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">A defensible record of the investigation.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Structured evidence, deterministic risk analysis, and agent outputs correlated in one SOC-grade report.</p></div><Badge className={`border px-3 py-1.5 font-mono text-[10px] tracking-[.13em] ${highRisk ? "border-red-300/20 bg-red-400/10 text-red-100" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"}`}>{investigation.risk_level.toUpperCase()} RISK</Badge></div>

      <Card className="glass overflow-hidden border-[#9e8bff]/25"><CardContent className="relative p-0"><div aria-hidden="true" className="absolute -right-20 -top-16 size-72 rounded-full bg-[#705ee7]/15 blur-3xl" /><div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-10"><div><div className="flex flex-wrap items-center gap-3"><p className="font-mono text-xs tracking-[.15em] text-[#b6abff]">REPORT ID · NOT ISSUED BY CURRENT CONTRACT</p><span className="h-px w-12 bg-[#9e8bff]/40" /></div><p className="mt-7 text-xs font-medium tracking-[.14em] text-slate-500">CASE REFERENCE</p><p className="mt-2 font-mono text-2xl font-semibold text-white md:text-3xl">{investigation.case_number}</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Metadata label="INVESTIGATION ID" value={investigation.id} mono /><Metadata label="SUBJECT" value="Not returned by current contract" unavailable /><Metadata label="ARTIFACT REFERENCE" value={investigation.artifact_reference} mono /><Metadata label="GENERATED TIMESTAMP" value="Not issued by current contract" unavailable /><Metadata label="GENERATED BY (ATLAS)" value="Not returned by current agent results" unavailable /></div></div><div className="rounded-2xl border border-white/[.09] bg-[#080b22]/65 p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium tracking-[.14em] text-[#b4a8ff]">REPORT OUTCOME</p><p className={`mt-2 text-xl font-semibold ${highRisk ? "text-red-100" : "text-emerald-100"}`}>{titleCase(investigation.verdict)}</p></div><ShieldAlert aria-hidden="true" className={`size-7 ${highRisk ? "text-red-200" : "text-emerald-200"}`} /></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><HeroMetric label="TRUST RATING" value={certificate.trust_rating} /><HeroMetric label="CONFIDENCE" value={`${Math.round(risk.confidence * 100)}%`} /></div><p className="mt-6 text-xs leading-5 text-slate-500">Certificate {certificate.certificate_number} links this report to its structured case evidence.</p></div></div></CardContent></Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={Radar} eyebrow="EXECUTIVE SUMMARY" title="First-read investigation outcome" /><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><SummaryMetric label="FINAL VERDICT" value={titleCase(investigation.verdict)} /><SummaryMetric label="OVERALL RISK" value={investigation.risk_level} /><SummaryMetric label="IDENTITY MATCH" value={`${identityMatch}%`} /><SummaryMetric label="CONFIDENCE" value={`${Math.round(risk.confidence * 100)}%`} /><SummaryMetric label="DURATION" value={duration(result)} /><SummaryMetric label="TRUST RATING" value={certificate.trust_rating} /></div><div className="mt-6 rounded-xl border border-white/[.07] bg-white/[.025] p-4 text-sm leading-6 text-slate-400">The submitted artifact is evaluated against a versioned Identity Genome using the deterministic signals and evidence shown below. The final verdict comes from the Risk Engine, not an unstructured model response.</div></CardContent></Card>
        <Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={Clock3} eyebrow="INVESTIGATION TIMELINE" title="Chain of custody" /><ol className="mt-7 space-y-0">{investigation.timeline.map((event, index) => <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07, duration: 0.3 }} className="relative flex gap-4 pb-5 last:pb-0" key={`${event.state}-${event.occurred_at}`}>{index < investigation.timeline.length - 1 && <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-1px)] w-px bg-white/[.08]" />}<span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-emerald-300/15 bg-emerald-400/10"><Check aria-hidden="true" className="size-3 text-emerald-200" /></span><div className="pt-0.5"><p className="text-sm text-slate-200">{timelineLabels[event.state] ?? titleCase(event.state)}</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-slate-600">{timestamp(event.occurred_at)}</p></div></motion.li>)}</ol></CardContent></Card></div>

      <Card className="glass mt-5 border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={Fingerprint} eyebrow="AGENT FINDINGS" title="Returned specialist results" /><p className="mt-2 text-xs text-slate-500">Only agents returned by the backend are rendered; absent specialists are not inferred.</p><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <AgentFinding key={agent.agent} agent={agent} />)}{!agents.length && <p className="rounded-xl border border-dashed border-white/[.1] p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">No agent results were returned for this investigation.</p>}</div></CardContent></Card>

      <Card className="glass mt-5 border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={CircleDotDashed} eyebrow="EVIDENCE MATRIX" title="Signals grouped by category" /><div className="mt-6 grid gap-4 lg:grid-cols-2">{groupedEvidence.map(([category, items]) => <div className="rounded-2xl border border-white/[.08] bg-[#080b22]/50 p-4" key={category}><div className="flex items-center justify-between gap-4"><h3 className="text-sm font-medium capitalize text-slate-100">{category}</h3><span className="font-mono text-[10px] tracking-[.12em] text-slate-500">{items?.length ?? 0} SIGNALS</span></div><div className="mt-4 divide-y divide-white/[.07] rounded-xl border border-white/[.07]">{items?.map((item) => { const finding = findingsByEvidence.get(item.code); return <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={`${item.agent.agent}-${item.code}`}><div><p className="text-sm font-medium text-slate-200">{titleCase(item.code)}</p><p className="mt-1 text-xs text-slate-500">Description: not returned by current contract</p><p className="mt-1 text-xs text-slate-500">Source: {item.source_reference}</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-slate-600">{finding?.severity ?? "SEVERITY NOT RETURNED"}</p></div><div className="text-left sm:text-right"><p className="font-mono text-sm text-[#b7abff]">{Math.round(item.weight * 100)}%</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-slate-600">CONFIDENCE</p></div></div>; })}</div></div>)}{!groupedEvidence.length && <p className="rounded-xl border border-dashed border-white/[.1] p-4 text-sm text-slate-500 lg:col-span-2">No evidence was returned for this investigation.</p>}</div></CardContent></Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={BarChart3} eyebrow="RISK ASSESSMENT" title="Deterministic confidence breakdown" /><div className="mt-6 space-y-4">{Object.entries(risk.breakdown).filter(([key]) => key !== "weighted_score").map(([key, value]) => <div key={key}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="capitalize text-slate-400">{key}</span><span className="font-mono text-slate-200">{Math.round(value * 100)}%</span></div><Progress value={value * 100} className="h-1.5 bg-white/[.08] [&>div]:bg-gradient-to-r [&>div]:from-[#9078ff] [&>div]:to-[#52c9fa]" /></div>)}</div><div className="mt-6 grid gap-3 border-t border-white/[.08] pt-5 sm:grid-cols-3"><HeroMetric label="OVERALL RISK" value={investigation.risk_level.toUpperCase()} /><HeroMetric label="IDENTITY MATCH" value={`${identityMatch}%`} /><HeroMetric label="RISK SCORE" value={`${riskScore}%`} /></div><div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm text-amber-100"><ShieldCheck aria-hidden="true" className="mr-2 inline size-4" />Recommended actions are not returned by the current backend contract.</div></CardContent></Card>
        <Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={FileText} eyebrow="TECHNICAL METADATA" title="Investigation provenance" /><div className="mt-6 grid gap-3 sm:grid-cols-2"><TechnicalMetric label="GENOME VERSION" value={investigation.genome_version} /><TechnicalMetric label="INVESTIGATION REFERENCE" value={investigation.artifact_reference} mono /><TechnicalMetric label="CERTIFICATE REFERENCE" value={certificate.certificate_number} mono /><TechnicalMetric label="ARTIFACT TYPE" value={investigation.artifact_type} /><TechnicalMetric label="ARTIFACT METADATA" value="Not returned by current contract" unavailable /><TechnicalMetric label="REQUEST ID" value="Not returned by current contract" unavailable /><TechnicalMetric label="PROCESSING DURATION" value={duration(result)} /><TechnicalMetric label="AGENT VERSIONS" value={agents.length ? agents.map((agent) => `${agent.agent}: ${agent.version}`).join(" · ") : "No agents returned"} mono /></div></CardContent></Card></div>

      <Card className="glass mt-5 border-white/10"><CardContent className="flex flex-wrap items-center justify-between gap-5 p-5 md:p-6"><div><p className="text-sm font-medium text-white">Report actions</p><p className="mt-1 text-xs text-slate-500">Navigate through the associated forensic record or export the currently available structured report.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={onReturnToCaseFile}><ArrowLeft aria-hidden="true" />Return to Case File</Button><Button type="button" variant="outline" onClick={onViewCertificate}><ShieldCheck aria-hidden="true" />View TrustDNA Certificate</Button><Button type="button" variant="outline" onClick={() => exportReport(result)}><Download aria-hidden="true" />Export Report</Button><Button type="button" onClick={onStartNewInvestigation} className="bg-[#8b78f6] text-white hover:bg-[#9d8cff]"><RefreshCcw aria-hidden="true" />Start New Investigation</Button></div></CardContent></Card>
    </section>
  );
}

export function EvidenceReportSkeleton() { return <section aria-label="Preparing Evidence Report" className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10"><Card className="glass border-white/[.1]"><CardContent className="animate-pulse p-6 md:p-8"><div className="h-3 w-40 rounded bg-[#a791ff]/20" /><div className="mt-5 h-8 max-w-xl rounded bg-white/[.08]" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-24 rounded-xl bg-white/[.05]" /><div className="h-24 rounded-xl bg-white/[.05]" /><div className="h-24 rounded-xl bg-white/[.05]" /></div></CardContent></Card></section>; }

function AgentFinding({ agent }: { agent: AgentResult }) { return <div className="rounded-xl border border-white/[.08] bg-[#080b22]/50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="capitalize text-sm font-medium text-slate-200">{agent.agent}</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-emerald-200">COMPLETE</p></div><span className="font-mono text-sm text-[#b7abff]">{Math.round(agent.confidence * 100)}%</span></div><dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.07] pt-3"><div><dt className="font-mono text-[10px] tracking-[.1em] text-slate-600">PROCESSING</dt><dd className="mt-1 font-mono text-xs text-slate-300">{agent.processing_time_ms} ms</dd></div><div><dt className="font-mono text-[10px] tracking-[.1em] text-slate-600">EVIDENCE</dt><dd className="mt-1 font-mono text-xs text-slate-300">{agent.evidence.length}</dd></div></dl><p className="mt-4 text-xs leading-5 text-slate-500">{agent.findings[0] ? titleCase(agent.findings[0].code) : "No finding summary returned."}</p><p className="mt-3 border-t border-white/[.07] pt-3 font-mono text-[10px] leading-5 tracking-[.08em] text-slate-600">SUPPORTING EVIDENCE · {agent.evidence.length ? agent.evidence.map((item) => titleCase(item.code)).join(" · ") : "NOT RETURNED"}</p></div>; }
function SectionTitle({ eyebrow, icon: Icon, title }: { eyebrow: string; icon: typeof Radar; title: string }) { return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#c0b5ff]"><Icon aria-hidden="true" className="size-4" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#aea3ff]">{eyebrow}</p><h3 className="mt-1 text-sm font-medium text-white">{title}</h3></div></div>; }
function HeroMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 break-all font-mono text-xl font-semibold text-white">{value}</p></div>; }
function Metadata({ label, mono = false, unavailable = false, value }: { label: string; mono?: boolean; unavailable?: boolean; value: string }) { return <div><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-1.5 break-all text-xs ${unavailable ? "text-slate-600" : "text-slate-300"} ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
function SummaryMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className="mt-2 break-all text-sm capitalize text-slate-200">{value}</p></div>; }
function TechnicalMetric({ label, mono = false, unavailable = false, value }: { label: string; mono?: boolean; unavailable?: boolean; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-[#080b22]/50 p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-2 break-all text-xs leading-5 ${unavailable ? "text-slate-600" : "text-slate-300"} ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
