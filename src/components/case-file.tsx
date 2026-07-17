import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDotDashed,
  Clock3,
  Download,
  Fingerprint,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { InvestigationResult, Scenario } from "@/features/judge/types";

type CaseFileProps = {
  result: InvestigationResult;
  scenario: Scenario;
  onBackToJudgeMode: () => void;
  backLabel?: string;
  onRunNewInvestigation: () => void;
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

function timeOnly(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function duration(start?: string, end?: string) {
  if (!start || !end) return "Not available";
  const elapsedMs = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  if (elapsedMs < 1_000) return "< 1 second";
  return `${(elapsedMs / 1_000).toFixed(1)} seconds`;
}

function downloadEvidenceReport(result: InvestigationResult, scenario: Scenario) {
  const lines = [
    "TrustDNA AI — Evidence Report",
    `Case: ${result.investigation.case_number}`,
    `Investigation ID: ${result.investigation.id}`,
    `Subject: ${scenario.subject}`,
    `Verdict: ${titleCase(result.investigation.verdict)}`,
    `Risk level: ${result.investigation.risk_level}`,
    `Evidence confidence: ${Math.round(result.risk.confidence * 100)}%`,
    "",
    "Evidence:",
    ...result.agents.flatMap((agent) => agent.evidence.map((evidence) => `- ${titleCase(evidence.code)} (${Math.round(evidence.weight * 100)}%): ${evidence.source_reference}`)),
  ];
  const downloadUrl = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `${result.investigation.case_number.toLowerCase()}-evidence-report.txt`;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);
}

export function CaseFile({ result, scenario, onBackToJudgeMode, onRunNewInvestigation, backLabel = "Back to Judge Mode" }: CaseFileProps) {
  const isImpersonation = result.investigation.verdict === "impersonation_confirmed";
  const riskScore = Math.round(result.risk.breakdown.weighted_score * 100);
  const identityMatch = Math.max(0, 100 - riskScore);
  const evidenceConfidence = Math.round(result.risk.confidence * 100);
  const cipher = result.agents.find((agent) => agent.agent === "cipher");
  const evidence = cipher?.evidence ?? [];
  const findingByEvidenceCode = new Map(cipher?.findings.flatMap((finding) => finding.evidence_codes.map((code) => [code, finding])) ?? []);
  const openedAt = result.investigation.timeline[0]?.occurred_at;
  const closedAt = result.investigation.timeline.at(-1)?.occurred_at;

  return (
    <section aria-labelledby="case-file-title" className="mx-auto w-full max-w-7xl px-5 py-14 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">FORENSIC CASE FILE</p>
          <h2 id="case-file-title" className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Evidence, not opinions.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            A transparent record of the investigation, correlated against a versioned Identity Genome.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs tracking-[.12em] text-[#b2a7ff]">{result.investigation.case_number}</p>
          <p className="mt-2 text-xs text-slate-500">Genome {result.investigation.genome_version.toUpperCase()}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.08] sm:grid-cols-2 xl:grid-cols-5">
        <HeaderMetric label="STATUS" value={`${result.investigation.risk_level.toUpperCase()} · ${titleCase(result.investigation.status)}`} />
        <HeaderMetric label="SUBJECT" value={scenario.subject} />
        <HeaderMetric label="CREATED" value={openedAt ? timestamp(openedAt) : "Not available"} />
        <HeaderMetric label="DURATION" value={duration(openedAt, closedAt)} />
        <HeaderMetric label="INVESTIGATION ID" value={result.investigation.id} mono />
      </div>

      <Card className={`overflow-hidden border ${isImpersonation ? "border-red-300/25" : "border-emerald-300/25"} glass`}>
        <CardContent className="relative p-0">
          <div className={`absolute inset-x-0 top-0 h-px ${isImpersonation ? "bg-gradient-to-r from-transparent via-red-300/90 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-300/90 to-transparent"}`} />
          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.15fr_.85fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`border px-3 py-1.5 font-mono text-[10px] tracking-[.14em] ${isImpersonation ? "border-red-200/25 bg-red-400/10 text-red-100" : "border-emerald-200/25 bg-emerald-400/10 text-emerald-100"}`}>
                  {result.investigation.risk_level.toUpperCase()} RISK
                </Badge>
                <span className="font-mono text-[10px] tracking-[.12em] text-slate-500">{scenario.artifactReference}</span>
              </div>
              <div className="mt-7 flex gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isImpersonation ? "bg-red-400/10 text-red-200" : "bg-emerald-400/10 text-emerald-200"}`}>
                  {isImpersonation ? <AlertTriangle aria-hidden="true" className="size-6" /> : <ShieldCheck aria-hidden="true" className="size-6" />}
                </span>
                <div>
                  <p className="text-xs font-medium tracking-[.16em] text-slate-500">FINAL VERDICT</p>
                  <h3 className={`mt-2 text-2xl font-semibold tracking-tight md:text-3xl ${isImpersonation ? "text-red-100" : "text-emerald-100"}`}>
                    {isImpersonation ? "IMPERSONATION CONFIRMED" : "IDENTITY CONSISTENT"}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                    {isImpersonation
                      ? "The artifact materially conflicts with the verified identity pattern. Do not act on the request without an independent verification channel."
                      : "The available evidence is consistent with the selected Identity Genome."}
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Metric label="IDENTITY MATCH" value={`${identityMatch}%`} tone={isImpersonation ? "risk" : "safe"} detail="Behavioral alignment" />
                <Metric label="EVIDENCE CONFIDENCE" value={`${evidenceConfidence}%`} tone="neutral" detail="Corroborated signals" />
                <Metric label="TRUST RATING" value={result.certificate.trust_rating} tone="neutral" detail="Certificate issued" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/[.09] bg-[#070a20]/65 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium tracking-[.14em] text-[#b4a8ff]">RISK ENGINE</p>
                  <p className="mt-1 text-sm text-slate-300">Deterministic confidence breakdown</p>
                </div>
                <ShieldAlert aria-hidden="true" className="size-5 text-[#b5a8ff]" />
              </div>
              <div className="mt-6 space-y-4">
                {Object.entries(result.risk.breakdown)
                  .filter(([key]) => key !== "weighted_score")
                  .map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
                        <span className="capitalize text-slate-400">{key}</span>
                        <span className="font-mono text-slate-200">{Math.round(value * 100)}%</span>
                      </div>
                      <Progress value={value * 100} className="h-1.5 bg-white/[.08] [&>div]:bg-gradient-to-r [&>div]:from-[#9b82ff] [&>div]:to-[#4cccf8]" />
                    </div>
                  ))}
              </div>
              <div className="mt-6 border-t border-white/[.08] pt-4">
                <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Correlated risk score</span><span className="font-mono text-red-200">{riskScore}%</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">The Risk Engine determines the verdict; AI agents supply structured evidence, not an opaque decision.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.86fr_1.14fr]">
        <Card className="glass border-white/10">
          <CardContent className="p-6 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#b9adff]"><Clock3 aria-hidden="true" className="size-4" /></span><div><h3 className="text-sm font-medium text-white">Chain of custody</h3><p className="text-xs text-slate-500">A chronological investigation record</p></div></div>
            <ol className="mt-7 space-y-0">
              {result.investigation.timeline.map((event, index) => {
                const isLast = index === result.investigation.timeline.length - 1;
                return <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08, duration: 0.32 }} className="relative flex gap-4 pb-6 last:pb-0" key={`${event.state}-${event.occurred_at}`}>
                  {!isLast && <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-1px)] w-px bg-white/[.08]" />}
                  <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border border-emerald-300/15 bg-emerald-400/10"><Check aria-hidden="true" className="size-3 text-emerald-200" /></span>
                  <div className="min-w-0 pt-0.5"><p className="text-sm leading-5 text-slate-200">{timelineLabels[event.state] ?? titleCase(event.state)}</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-slate-600">{timeOnly(event.occurred_at)}</p></div>
                </motion.li>;
              })}
            </ol>
            {openedAt && <p className="mt-6 border-t border-white/[.08] pt-4 font-mono text-[10px] tracking-[.1em] text-slate-600">OPENED {timestamp(openedAt)}</p>}
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-red-400/10 text-red-200"><Fingerprint aria-hidden="true" className="size-4" /></span><div><h3 className="text-sm font-medium text-white">Evidence ledger</h3><p className="text-xs text-slate-500">Signals that support this verdict</p></div></div><Badge variant="outline" className="border-white/10 font-mono text-[10px] text-slate-400">{evidence.length} SIGNALS</Badge></div>
            <div className="mt-7 divide-y divide-white/[.07] rounded-xl border border-white/[.07] bg-[#080b22]/50">
              {evidence.map((item) => {
                const critical = item.weight >= 0.8;
                const finding = findingByEvidenceCode.get(item.code);
                return <div className="grid gap-3 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center" key={item.code}>
                  <span className={`grid size-8 place-items-center rounded-lg ${critical ? "bg-red-400/10 text-red-200" : "bg-amber-300/10 text-amber-200"}`}><CircleDotDashed aria-hidden="true" className="size-4" /></span>
                  <div><p className="text-sm font-medium text-slate-200">{titleCase(item.code)}</p><p className="mt-1 text-xs text-slate-500">{titleCase(item.category)} · Supporting evidence: {item.source_reference}</p></div>
                  <div className="text-left sm:text-right"><p className={`font-mono text-sm ${critical ? "text-red-200" : "text-amber-200"}`}>{Math.round(item.weight * 100)}%</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-slate-600">{finding?.severity ?? "NOT SPECIFIED"}</p></div>
                </div>;
              })}
              {!evidence.length && <p className="p-4 text-sm text-slate-500">No structured evidence was returned for this artifact.</p>}
            </div>
            <div className="mt-7 border-t border-white/[.08] pt-6">
              <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-medium text-white">Agent investigation panel</h3><p className="mt-1 text-xs text-slate-500">Only agents returned by this investigation are shown.</p></div><Badge variant="outline" className="border-white/10 font-mono text-[10px] text-slate-400">{result.agents.length} RESULTS</Badge></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.agents.map((agent) => <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4" key={agent.agent}><div className="flex items-center justify-between gap-3"><div><p className="capitalize text-sm font-medium text-slate-200">{agent.agent}</p><p className="mt-1 font-mono text-[10px] tracking-[.1em] text-emerald-200">COMPLETE</p></div><span className="font-mono text-sm text-[#b7abff]">{Math.round(agent.confidence * 100)}%</span></div><dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.07] pt-3"><div><dt className="font-mono text-[10px] tracking-[.1em] text-slate-600">EXECUTION</dt><dd className="mt-1 font-mono text-xs text-slate-300">{agent.processing_time_ms} ms</dd></div><div><dt className="font-mono text-[10px] tracking-[.1em] text-slate-600">VERSION</dt><dd className="mt-1 font-mono text-xs text-slate-300">{agent.version}</dd></div></dl><p className="mt-4 text-xs leading-5 text-slate-500">{agent.findings[0] ? titleCase(agent.findings[0].code) : "No finding summary returned."}</p></div>)}
                {!result.agents.length && <p className="rounded-xl border border-dashed border-white/[.1] p-4 text-sm text-slate-500 sm:col-span-2">No agent results were returned by this investigation.</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass mt-5 border-white/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-5 p-5 md:p-6">
          <div><p className="text-sm font-medium text-white">Case actions</p><p className="mt-1 text-xs text-slate-500">Certificate, evidence export, and a fresh investigation use this same verified case context.</p></div>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => document.getElementById("certificate")?.scrollIntoView({ behavior: "smooth", block: "start" })}><ShieldCheck aria-hidden="true" />View Certificate</Button><Button type="button" variant="outline" onClick={() => downloadEvidenceReport(result, scenario)}><Download aria-hidden="true" />Download Evidence Report</Button><Button type="button" variant="outline" onClick={onBackToJudgeMode}><ArrowRight aria-hidden="true" />{backLabel}</Button><Button type="button" onClick={onRunNewInvestigation} className="bg-[#8b78f6] text-white hover:bg-[#9d8cff]"><RefreshCcw aria-hidden="true" />Run New Investigation</Button></div>
        </CardContent>
      </Card>
    </section>
  );
}

function HeaderMetric({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return <div className="min-w-0 bg-[#0b0e27]/70 px-4 py-3.5"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-1.5 truncate text-xs text-slate-300 ${mono ? "font-mono" : ""}`} title={value}>{value}</p></div>;
}

function Metric({ detail, label, tone, value }: { detail: string; label: string; tone: "risk" | "safe" | "neutral"; value: string }) {
  const valueClass = tone === "risk" ? "text-red-100" : tone === "safe" ? "text-emerald-100" : "text-white";
  return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-500">{label}</p><p className={`mt-2 font-mono text-2xl font-semibold ${valueClass}`}>{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}
