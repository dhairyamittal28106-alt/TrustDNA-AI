import Link from "next/link";
import { ArrowRight, BadgeCheck, FileText, KeyRound, ShieldAlert, UserRound, type LucideIcon } from "lucide-react";
import { PlatformShell } from "@/components/platform-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommandCenterDashboard } from "@/features/dashboard/components/command-center-dashboard";
import { AnalystWorkspace } from "@/features/analyst/components/analyst-workspace";
import { GmailConnectionCard } from "@/features/gmail/components/gmail-connection-card";
import { GmailSyncWorkspace } from "@/features/gmail/components/gmail-sync-workspace";
import { IdentityIntelligenceWorkspace } from "@/features/identity-intelligence/components/identity-intelligence-workspace";
import { IdentityTwinWorkspace } from "@/features/identity-twin/components/identity-twin-workspace";
import { InvestigationWorkspace } from "@/features/investigation/components/investigation-workspace";
import { LiveInvestigationWorkspace } from "@/features/live-investigation/components/live-investigation-workspace";

export const platformSections = ["dashboard", "genome", "gmail", "twin", "analyst", "investigate", "live-investigation", "investigations", "cases", "certificates", "reports", "profile", "settings"] as const;
export type PlatformSection = typeof platformSections[number];

const sectionCopy: Record<Exclude<PlatformSection, "dashboard" | "genome" | "gmail" | "twin" | "analyst" | "investigate" | "live-investigation" | "settings">, { eyebrow: string; title: string; body: string; icon: LucideIcon; action: string; actionHref: string }> = {
  investigations: { eyebrow: "INVESTIGATIONS", title: "Open a new evidence-backed investigation.", body: "Bring a suspicious artifact to TrustDNA and let specialized investigators turn signals into an explainable decision.", icon: ShieldAlert, action: "Start an investigation", actionHref: "/investigate" },
  cases: { eyebrow: "CASE FILES", title: "Your resolved cases belong in one place.", body: "Review the full evidence trail, final verdict, and recommended actions for every investigation.", icon: FileText, action: "Open an investigation", actionHref: "/investigate" },
  certificates: { eyebrow: "CERTIFICATES", title: "Portable trust credentials, backed by evidence.", body: "TrustDNA Certificates make an Identity Genome’s trust posture clear, shareable, and verifiable.", icon: BadgeCheck, action: "Start an investigation", actionHref: "/investigate" },
  reports: { eyebrow: "EVIDENCE REPORTS", title: "Evidence stays readable, shareable, and traceable.", body: "Turn complex forensic signals into clear, professional evidence reports that people can act on.", icon: FileText, action: "Start an investigation", actionHref: "/investigate" },
  profile: { eyebrow: "PROFILE", title: "Your profile stays under your control.", body: "Manage the personal details that support your trusted identity and Guardian experience.", icon: UserRound, action: "View dashboard", actionHref: "/dashboard" },
};

export function PlatformWorkspace({ section }: { section: PlatformSection }) {
  if (section === "dashboard") return <PlatformShell active="dashboard"><CommandCenterDashboard /></PlatformShell>;
  if (section === "genome") return <PlatformShell active="genome"><IdentityIntelligenceWorkspace /></PlatformShell>;
  if (section === "gmail") return <PlatformShell active="gmail"><GmailSyncWorkspace /></PlatformShell>;
  if (section === "twin") return <PlatformShell active="twin"><IdentityTwinWorkspace /></PlatformShell>;
  if (section === "analyst") return <PlatformShell active="analyst"><AnalystWorkspace /></PlatformShell>;
  if (section === "investigate") return <PlatformShell active="investigate"><InvestigationWorkspace /></PlatformShell>;
  if (section === "live-investigation") return <PlatformShell active="live-investigation"><LiveInvestigationWorkspace /></PlatformShell>;
  if (section === "settings") return <SettingsWorkspace />;
  return <GenericWorkspace content={sectionCopy[section]} section={section} />;
}

function SettingsWorkspace() {
  return <PlatformShell active="settings"><section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10"><div className="max-w-3xl"><div className="inline-flex size-11 place-items-center rounded-2xl bg-[#8b78f6]/15 p-3 text-[#c0b6ff]"><KeyRound aria-hidden="true" className="size-5" /></div><p className="mt-6 font-mono text-[10px] tracking-[.16em] text-[#afa4ff]">SETTINGS</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Control consent at every source.</h1><p className="mt-4 text-sm leading-7 text-slate-400">TrustDNA keeps the sources that shape your Identity Genome visible, explainable, and under your control.</p></div><div className="mt-8 max-w-3xl"><GmailConnectionCard /></div></section></PlatformShell>;
}

function GenericWorkspace({ content, section }: { content: { eyebrow: string; title: string; body: string; icon: LucideIcon; action: string; actionHref: string }; section: PlatformSection }) {
  const Icon = content.icon;
  return <PlatformShell active={section}><section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl items-center px-5 py-12 md:px-8"><Card className="glass w-full border-white/[.1]"><CardContent className="max-w-2xl p-7 md:p-10"><span className="grid size-12 place-items-center rounded-2xl bg-[#8b78f6]/15 text-[#c0b6ff]"><Icon aria-hidden="true" className="size-6" /></span><p className="mt-8 font-mono text-[11px] tracking-[.16em] text-[#afa4ff]">{content.eyebrow}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{content.title}</h1><p className="mt-5 text-sm leading-7 text-slate-400 md:text-base">{content.body}</p><div className="mt-8 rounded-xl border border-[#a99bff]/15 bg-[#8f7bfa]/[.06] px-4 py-3 text-xs leading-5 text-slate-300">Every TrustDNA decision connects evidence, context, and a clear explanation.</div><Button asChild className="mt-7 h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9c8aff]"><Link href={content.actionHref}>{content.action}<ArrowRight className="size-4" /></Link></Button></CardContent></Card></section></PlatformShell>;
}
