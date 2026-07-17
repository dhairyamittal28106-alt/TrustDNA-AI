import {
  BadgeCheck,
  Download,
  ExternalLink,
  FileText,
  Fingerprint,
  KeyRound,
  QrCode,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { InvestigationResult } from "@/features/judge/types";

type TrustCertificateProps = {
  result: InvestigationResult;
  onStartNewInvestigation: () => void;
  onViewCaseFile: () => void;
  onViewEvidenceReport: () => void;
};

function timestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function investigationDuration(result: InvestigationResult) {
  const timeline = result.investigation.timeline;
  const first = timeline[0]?.occurred_at;
  const last = timeline.at(-1)?.occurred_at;
  if (!first || !last) return "Not available";
  const durationMs = Math.max(0, new Date(last).getTime() - new Date(first).getTime());
  return durationMs < 1_000 ? "< 1 second" : `${(durationMs / 1_000).toFixed(1)} seconds`;
}

function downloadCertificate(result: InvestigationResult) {
  const { certificate, investigation } = result;
  const content = [
    "TrustDNA AI — Digital Identity Certificate",
    `Certificate number: ${certificate.certificate_number}`,
    `Certificate ID: ${certificate.id}`,
    `Investigation reference: ${investigation.case_number}`,
    `Investigation ID: ${certificate.investigation_id}`,
    `Identity Genome ID: ${certificate.identity_genome_id}`,
    `Genome version: ${investigation.genome_version}`,
    `Trust rating: ${certificate.trust_rating}`,
    `Identity confidence: ${Math.round(certificate.identity_confidence * 100)}%`,
    `Issued: ${certificate.issued_at}`,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${certificate.certificate_number.toLowerCase()}-certificate.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function TrustCertificate({ result, onStartNewInvestigation, onViewCaseFile, onViewEvidenceReport }: TrustCertificateProps) {
  const { certificate, investigation, agents } = result;
  const isVerified = investigation.status === "closed" || investigation.lifecycle_state === "closed";

  return (
    <section id="certificate" aria-labelledby="certificate-title" className="mx-auto w-full max-w-7xl scroll-mt-6 px-5 py-12 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">TRUSTDNA CERTIFICATE</p><h2 id="certificate-title" className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">A portable identity credential.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">The certificate is a structured, evidence-backed record—not a PDF-shaped claim.</p></div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100"><BadgeCheck aria-hidden="true" className="size-4" />{isVerified ? "VERIFIED CASE RECORD" : "CASE RECORD PENDING"}</span>
      </div>

      <Card className="glass overflow-hidden border-[#a791ff]/35">
        <CardContent className="relative p-0">
          <div aria-hidden="true" className="absolute -right-20 -top-16 size-72 rounded-full bg-[#705ee7]/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid gap-8 p-6 md:p-8 lg:grid-cols-[1.08fr_.92fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3"><p className="font-mono text-xs tracking-[.16em] text-[#b9adff]">TRUSTDNA AI · IDENTITY PASSPORT</p><span className="h-px w-10 bg-[#a792ff]/50" /></div>
              <p className="mt-8 text-xs font-medium tracking-[.15em] text-slate-500">CERTIFICATE NUMBER</p>
              <p className="mt-2 break-all font-mono text-2xl font-semibold tracking-tight text-white md:text-3xl">{certificate.certificate_number}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3"><HeroMetric label="TRUST RATING" value={certificate.trust_rating} /><HeroMetric label="IDENTITY CONFIDENCE" value={`${Math.round(certificate.identity_confidence * 100)}%`} /><HeroMetric label="GENOME VERSION" value={investigation.genome_version.toUpperCase()} /></div>
              <div className="mt-8 grid gap-3 border-t border-white/[.1] pt-5 text-sm sm:grid-cols-2"><Metadata label="INVESTIGATION REFERENCE" value={investigation.case_number} mono /><Metadata label="ISSUED" value={timestamp(certificate.issued_at)} /><Metadata label="CERTIFICATE ID" value={certificate.id} mono /><Metadata label="INVESTIGATION ID" value={certificate.investigation_id} mono /></div>
            </div>
            <div className="rounded-2xl border border-white/[.1] bg-[#080b22]/65 p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium tracking-[.14em] text-[#b4a8ff]">VERIFICATION STATUS</p><p className="mt-2 text-lg font-medium text-white">{isVerified ? "Certificate issued" : "Awaiting case closure"}</p></div><ShieldCheck aria-hidden="true" className="size-7 text-[#c0b5ff]" /></div><div className="mt-7 grid place-items-center rounded-xl border border-[#a791ff]/20 bg-[#765ee7]/[.07] p-5"><QrCode aria-hidden="true" className="size-24 text-[#c1b6ff]" /><p className="mt-4 text-center font-mono text-[10px] tracking-[.14em] text-slate-500">QR VERIFICATION PLACEHOLDER</p></div><p className="mt-5 text-xs leading-5 text-slate-500">A scannable public-verification URL is not present in the current certificate contract.</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={Fingerprint} eyebrow="IDENTITY OVERVIEW" title="Identity Genome reference" /><div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/[.08] bg-white/[.08] sm:grid-cols-2"><Credential label="IDENTITY GENOME ID" value={certificate.identity_genome_id} mono /><Credential label="GENOME FINGERPRINT" value="Not returned by certificate contract" unavailable /><Credential label="SOURCE COVERAGE" value="Not returned by certificate contract" unavailable /><Credential label="IDENTITY CONFIDENCE" value={`${Math.round(certificate.identity_confidence * 100)}%`} /><Credential label="TRUST RATING" value={certificate.trust_rating} /><Credential label="GENOME VERSION" value={investigation.genome_version.toUpperCase()} /></div></CardContent></Card>
        <Card className="glass border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={FileText} eyebrow="INVESTIGATION SUMMARY" title="Certificate provenance" /><div className="mt-6 grid gap-3 sm:grid-cols-2"><SummaryMetric label="VERDICT" value={investigation.verdict.replaceAll("_", " ")} /><SummaryMetric label="RISK LEVEL" value={investigation.risk_level} /><SummaryMetric label="EVIDENCE COUNT" value={String(agents.reduce((total, agent) => total + agent.evidence.length, 0))} /><SummaryMetric label="AGENT COUNT" value={String(agents.length)} /><SummaryMetric label="INVESTIGATION DURATION" value={investigationDuration(result)} /><SummaryMetric label="CASE ID" value={investigation.case_number} mono /></div></CardContent></Card>
      </div>

      <Card className="glass mt-5 border-white/10"><CardContent className="p-6 md:p-7"><SectionTitle icon={KeyRound} eyebrow="CERTIFICATE SECURITY" title="Integrity and verification" /><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><SecurityItem label="CERTIFICATE HASH" value="Not returned by certificate contract" unavailable /><SecurityItem label="DIGITAL SIGNATURE" value="Placeholder — not issued in MVP" /><SecurityItem label="TAMPER PROTECTION" value="Structured case linkage" /><SecurityItem label="VERIFICATION ENDPOINT" value="Not returned by certificate contract" unavailable /></div><div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[.06] p-4 text-sm text-emerald-100"><ShieldCheck aria-hidden="true" className="size-4 shrink-0" />This certificate is linked to investigation <span className="font-mono text-emerald-50">{certificate.investigation_id}</span> and Identity Genome <span className="font-mono text-emerald-50">{certificate.identity_genome_id}</span>.</div></CardContent></Card>

      <Card className="glass mt-5 border-white/10"><CardContent className="flex flex-wrap items-center justify-between gap-5 p-5 md:p-6"><div><p className="text-sm font-medium text-white">Certificate actions</p><p className="mt-1 text-xs text-slate-500">Actions retain the evidence-backed context of this certificate.</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={onViewCaseFile}><ExternalLink aria-hidden="true" />View Case File</Button><Button type="button" variant="outline" onClick={onViewEvidenceReport}><FileText aria-hidden="true" />View Evidence Report</Button><Button type="button" variant="outline" onClick={() => downloadCertificate(result)}><Download aria-hidden="true" />Download Certificate</Button><Button type="button" className="bg-[#8b78f6] text-white hover:bg-[#9d8cff]" onClick={onStartNewInvestigation}><RefreshCcw aria-hidden="true" />Start New Investigation</Button></div></CardContent></Card>
    </section>
  );
}

export function TrustCertificateSkeleton() {
  return <section aria-label="Preparing TrustDNA Certificate" className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10"><Card className="glass overflow-hidden border-[#a791ff]/20"><CardContent className="animate-pulse p-6 md:p-8"><div className="h-3 w-36 rounded bg-[#a791ff]/20" /><div className="mt-5 h-8 max-w-md rounded bg-white/[.08]" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-24 rounded-xl bg-white/[.05]" /><div className="h-24 rounded-xl bg-white/[.05]" /><div className="h-24 rounded-xl bg-white/[.05]" /></div></CardContent></Card></section>;
}

function SectionTitle({ eyebrow, icon: Icon, title }: { eyebrow: string; icon: typeof Fingerprint; title: string }) { return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#c0b5ff]"><Icon aria-hidden="true" className="size-4" /></span><div><p className="font-mono text-[10px] tracking-[.14em] text-[#aea3ff]">{eyebrow}</p><h3 className="mt-1 text-sm font-medium text-white">{title}</h3></div></div>; }
function HeroMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 font-mono text-xl font-semibold text-white">{value}</p></div>; }
function Metadata({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) { return <div><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-1.5 break-all text-xs text-slate-300 ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
function Credential({ label, mono = false, unavailable = false, value }: { label: string; mono?: boolean; unavailable?: boolean; value: string }) { return <div className="min-w-0 bg-[#090c25]/60 p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-2 break-all text-sm ${unavailable ? "text-slate-600" : "text-slate-200"} ${mono ? "font-mono text-xs" : ""}`}>{value}</p></div>; }
function SummaryMetric({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-2 break-all text-sm capitalize text-slate-200 ${mono ? "font-mono text-xs normal-case" : ""}`}>{value}</p></div>; }
function SecurityItem({ label, unavailable = false, value }: { label: string; unavailable?: boolean; value: string }) { return <div className="rounded-xl border border-white/[.07] bg-[#080b22]/50 p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-600">{label}</p><p className={`mt-2 text-xs leading-5 ${unavailable ? "text-slate-600" : "text-slate-300"}`}>{value}</p></div>; }
