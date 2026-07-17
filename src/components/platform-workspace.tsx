import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, Fingerprint, KeyRound, Mail, ShieldAlert, UserRound, type LucideIcon } from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuardianIntelligenceSummary } from "@/features/identity-intelligence/components/guardian-intelligence-summary";
import { GuardianDashboardPanel } from "@/features/guardian/components/guardian-dashboard-panel";
import { IdentityIntelligenceWorkspace } from "@/features/identity-intelligence/components/identity-intelligence-workspace";
import { IdentityTwinWorkspace } from "@/features/identity-twin/components/identity-twin-workspace";
import { GmailConnectionCard } from "@/features/gmail/components/gmail-connection-card";
import { GmailSyncWorkspace } from "@/features/gmail/components/gmail-sync-workspace";
import { LiveInvestigationWorkspace } from "@/features/live-investigation/components/live-investigation-workspace";
import { InvestigationWorkspace } from "@/features/investigation/components/investigation-workspace";

export const platformSections = ["dashboard", "genome", "gmail", "twin", "investigate", "live-investigation", "investigations", "cases", "certificates", "reports", "profile", "settings"] as const;
export type PlatformSection = typeof platformSections[number];

const sectionCopy: Record<Exclude<PlatformSection, "dashboard" | "genome" | "gmail" | "twin" | "investigate" | "live-investigation" | "settings">, { eyebrow: string; title: string; body: string; icon: LucideIcon; action: string; actionHref: string }> = {
  investigations: { eyebrow: "INVESTIGATIONS", title: "Open a new evidence-backed investigation.", body: "Bring a suspicious artifact to TrustDNA and let specialized investigators turn signals into an explainable decision.", icon: ShieldAlert, action: "Start an investigation", actionHref: "/investigate" },
  cases: { eyebrow: "CASE FILES", title: "Your resolved cases belong in one place.", body: "Review the full evidence trail, final verdict, and recommended actions for every investigation.", icon: FileText, action: "Open an investigation", actionHref: "/investigate" },
  certificates: { eyebrow: "CERTIFICATES", title: "Portable trust credentials, backed by evidence.", body: "TrustDNA Certificates make an Identity Genome’s trust posture clear, shareable, and verifiable.", icon: BadgeCheck, action: "Start an investigation", actionHref: "/investigate" },
  reports: { eyebrow: "EVIDENCE REPORTS", title: "Evidence stays readable, shareable, and traceable.", body: "Turn complex forensic signals into clear, professional evidence reports that people can act on.", icon: FileText, action: "Start an investigation", actionHref: "/investigate" },
  profile: { eyebrow: "PROFILE", title: "Your profile stays under your control.", body: "Manage the personal details that support your trusted identity and Guardian experience.", icon: UserRound, action: "View dashboard", actionHref: "/dashboard" },
};

export function PlatformWorkspace({ section }: { section: PlatformSection }) {
  if (section === "dashboard") return <Dashboard />;
  if (section === "genome") return <GenomeWorkspace />;
  if (section === "gmail") return <GmailWorkspace />;
  if (section === "twin") return <TwinWorkspace />;
  if (section === "investigate") return <InvestigateWorkspace />;
  if (section === "live-investigation") return <LiveInvestigation />;
  if (section === "settings") return <SettingsWorkspace />;
  return <GenericWorkspace content={sectionCopy[section]} section={section} />;
}

function Dashboard() {
  return (
    <PlatformShell active="dashboard">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-mono text-[11px] tracking-[.17em] text-[#aea3ff]">IDENTITY GUARDIAN</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Your trust layer is ready.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Your Identity Guardian connects the evidence you choose with explainable trust decisions—without filling gaps with assumptions.</p>
          </div>
          <Button asChild className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Link href="/genome">Open Intelligence Map <ArrowRight className="size-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <GuardianDashboardPanel />
          <GuardianIntelligenceSummary />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <GmailConnectionCard compact />
          <DashboardPanel icon={ShieldAlert} eyebrow="THREAT FEED" title="Protection that keeps watch" body="Your Guardian keeps evidence within reach when a suspicious artifact needs investigation." href="/investigate" action="New investigation" />
          <DashboardPanel icon={FileText} eyebrow="RECENT RECORDS" title="Evidence in one place" body="Your investigations, certificates, and reports stay connected to the facts." href="/demo" action="Try Judge Demo" />
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Card className="glass border-white/[.1]"><CardContent className="p-6"><p className="font-mono text-[10px] tracking-[.16em] text-slate-500">QUICK ACTIONS</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><QuickAction icon={Mail} title="Gmail Source" body="Connect consented sent email" href="/gmail" /><QuickAction icon={ShieldAlert} title="New Investigation" body="Investigate your own evidence" href="/investigate" /><QuickAction icon={Fingerprint} title="Identity Genome" body="Shape your trust layer" href="/genome" /><QuickAction icon={FileText} title="Evidence Reports" body="Review your evidence" href="/reports" /></div></CardContent></Card>
          <Card className="glass border-white/[.1]"><CardContent className="p-6"><p className="font-mono text-[10px] tracking-[.16em] text-slate-500">RECENT CERTIFICATES</p><div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[.1] bg-black/10 text-center"><BadgeCheck aria-hidden="true" className="size-6 text-slate-600" /><p className="mt-3 text-sm font-medium text-slate-300">Your first certificate is waiting</p><p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Complete an evidence-backed investigation to create a shareable TrustDNA Certificate.</p></div></CardContent></Card>
        </div>
      </section>
    </PlatformShell>
  );
}

function GenomeWorkspace() {
  return <PlatformShell active="genome"><IdentityIntelligenceWorkspace /></PlatformShell>;
}

function TwinWorkspace() {
  return <PlatformShell active="twin"><IdentityTwinWorkspace /></PlatformShell>;
}

function InvestigateWorkspace() {
  return <PlatformShell active="investigate"><InvestigationWorkspace /></PlatformShell>;
}

function LiveInvestigation() {
  return <PlatformShell active="live-investigation"><LiveInvestigationWorkspace /></PlatformShell>;
}

function GmailWorkspace() {
  return <PlatformShell active="gmail"><GmailSyncWorkspace /></PlatformShell>;
}

function SettingsWorkspace() {
  return <PlatformShell active="settings"><section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"><div className="max-w-3xl"><div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#8b78f6]/15 text-[#c0b6ff]"><KeyRound aria-hidden="true" className="size-5" /></div><p className="mt-6 font-mono text-[10px] tracking-[.16em] text-[#afa4ff]">SETTINGS</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Control consent at every source.</h1><p className="mt-4 text-sm leading-7 text-slate-400">TrustDNA keeps the sources that shape your Identity Genome visible, explainable, and under your control.</p></div><div className="mt-8 max-w-3xl"><GmailConnectionCard /></div></section></PlatformShell>;
}

function GenericWorkspace({ content, section }: { content: { eyebrow: string; title: string; body: string; icon: LucideIcon; action: string; actionHref: string }; section: PlatformSection }) {
  const Icon = content.icon;
  return <PlatformShell active={section}><section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl items-center px-5 py-12 md:px-8"><Card className="glass w-full border-white/[.1]"><CardContent className="max-w-2xl p-7 md:p-10"><span className="grid size-12 place-items-center rounded-2xl bg-[#8b78f6]/15 text-[#c0b6ff]"><Icon aria-hidden="true" className="size-6" /></span><p className="mt-8 font-mono text-[11px] tracking-[.16em] text-[#afa4ff]">{content.eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{content.title}</h1><p className="mt-5 text-sm leading-7 text-slate-400 md:text-base">{content.body}</p><div className="mt-8 rounded-xl border border-[#a99bff]/15 bg-[#8f7bfa]/[.06] px-4 py-3 text-xs leading-5 text-slate-300">Every TrustDNA decision connects evidence, context, and a clear explanation.</div><Button asChild className="mt-7 h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Link href={content.actionHref}>{content.action}<ArrowRight className="size-4" /></Link></Button></CardContent></Card></section></PlatformShell>;
}

function DashboardPanel({ icon: Icon, eyebrow, title, body, href, action }: { icon: LucideIcon; eyebrow: string; title: string; body: string; href: string; action: string }) {
  return <Card className="glass border-white/[.1]"><CardContent className="p-5"><Icon aria-hidden="true" className="size-5 text-[#b6abff]" /><p className="mt-5 font-mono text-[9px] tracking-[.14em] text-slate-600">{eyebrow}</p><h2 className="mt-2 text-base font-medium text-white">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-400">{body}</p><Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-xs text-[#b9afff] hover:text-white">{action}<ArrowRight className="size-3.5" /></Link></CardContent></Card>;
}

function QuickAction({ icon: Icon, title, body, href }: { icon: LucideIcon; title: string; body: string; href: string }) {
  return <Link href={href} className="rounded-xl border border-white/[.08] bg-black/10 p-4 transition hover:border-[#b1a5ff]/35 hover:bg-white/[.04]"><Icon aria-hidden="true" className="size-4 text-[#b8adff]" /><p className="mt-4 text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></Link>;
}
