import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  AudioLines,
  BadgeCheck,
  BrainCircuit,
  Building2,
  Eye,
  FileWarning,
  Fingerprint,
  LockKeyhole,
  MailWarning,
  Network,
  ScanSearch,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRoundX,
  Workflow,
} from "lucide-react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandMark } from "@/components/brand-mark";

type LandingPageProps = { onStart: () => void };

const threats = [
  { icon: BrainCircuit, title: "Deepfakes", body: "Synthetic media can now borrow anyone’s face, voice, or mannerisms." },
  { icon: UserRoundX, title: "Identity theft", body: "A stolen digital footprint can become a convincing false identity." },
  { icon: MailWarning, title: "Fake emails", body: "A single credible impersonation can reroute decisions and payments." },
  { icon: FileWarning, title: "Forged resumes", body: "Unverified credentials blur the line between evidence and assertion." },
  { icon: AudioLines, title: "Voice cloning", body: "Familiar voices can be weaponised in the seconds that matter most." },
  { icon: AlertTriangle, title: "Social engineering", body: "Urgency, trust, and context are now easy to manufacture." },
];

const workflow = [
  { icon: Fingerprint, title: "Identity Genome", body: "Map explainable digital identity signals." },
  { icon: ScanSearch, title: "Case Investigation", body: "Open an evidence-led investigation." },
  { icon: Network, title: "Evidence Correlation", body: "Connect structured forensic signals." },
  { icon: SearchCheck, title: "Risk Analysis", body: "Determine risk with a deterministic engine." },
  { icon: BadgeCheck, title: "TrustDNA Certificate", body: "Issue a portable trust credential." },
];

const agents = [
  { icon: Fingerprint, name: "Genesis", body: "Reconstructs the versioned Identity Genome." },
  { icon: SearchCheck, name: "Cipher", body: "Compares writing and communication signatures." },
  { icon: TimerReset, name: "Chronos", body: "Validates chronology and activity consistency." },
  { icon: ScanSearch, name: "ForensIQ", body: "Examines deterministic forensic signals." },
  { icon: Eye, name: "Spectra", body: "Inspects media and visual-risk signals." },
  { icon: FileWarning, name: "Atlas", body: "Compiles evidence into defensible reports." },
  { icon: ShieldCheck, name: "Sentinel", body: "Orchestrates the case; never invents evidence." },
];

const highlights = [
  { icon: Fingerprint, title: "Identity Genome", body: "Explainable identity traits, versioned for every case." },
  { icon: Eye, title: "Explainable AI", body: "Every conclusion is traceable to structured evidence." },
  { icon: ShieldCheck, title: "Evidence-led decisions", body: "A deterministic Risk Engine issues the verdict." },
  { icon: FileWarning, title: "Forensic reports", body: "Share a clear record, not an opaque score." },
  { icon: Network, title: "Multi-agent AI", body: "Specialists investigate one case through Sentinel." },
  { icon: LockKeyhole, title: "Privacy-first", body: "Identity remains transparent, consent-aware, and controllable." },
];

export function LandingPage({ onStart }: LandingPageProps) {
  return <>
    <section className="relative overflow-hidden px-5 pb-24 pt-5 md:px-10 lg:px-16">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[48rem] bg-[radial-gradient(circle_at_25%_8%,rgb(107_83_239_/_28%),transparent_24rem),radial-gradient(circle_at_78%_18%,rgb(35_176_245_/_18%),transparent_27rem)]" />
      <header className="mx-auto flex max-w-7xl items-center justify-between"><BrandMark /><Button onClick={onStart} variant="ghost" className="text-sm text-slate-300 hover:bg-white/5 hover:text-white">Judge Mode <ArrowRight className="size-4" /></Button></header>
      <div className="mx-auto grid max-w-7xl gap-12 pb-16 pt-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pt-28"><motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}><div className="inline-flex items-center gap-2 rounded-full border border-[#a598ff]/20 bg-[#8d78ff]/10 px-3 py-1.5 text-xs font-medium text-[#bcb2ff]"><Sparkles className="size-3.5" /> THE AI TRUST INFRASTRUCTURE FOR HUMAN IDENTITY</div><h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">Trust can&apos;t be generated.<br /><span className="bg-gradient-to-r from-[#b5a6ff] to-[#66d3ff] bg-clip-text text-transparent">It has to be verified.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-slate-300 md:text-lg">AI can now clone voices, forge emails, and impersonate anyone. TrustDNA investigates digital identity using explainable AI, forensic evidence, and specialized AI investigators.</p><div className="mt-9 flex flex-wrap gap-3"><Button onClick={onStart} className="h-12 rounded-xl bg-[#8b78f6] px-5 text-white shadow-xl shadow-violet-950/80 hover:bg-[#9d8cff]">Start Investigation <ArrowRight className="size-4" /></Button><Button onClick={onStart} variant="outline" className="h-12 rounded-xl border-white/15 bg-white/[.03] px-5 text-slate-200 hover:bg-white/[.08] hover:text-white">Try Judge Mode</Button></div><p className="mt-5 text-xs text-slate-500">Every investigation ends with evidence—not opinions.</p></motion.div><CasePreview /></div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 text-xs text-slate-500"><ArrowDown aria-hidden="true" className="size-3.5 text-[#a99bff]" />Built for the age when AI can imitate anyone.</div>
    </section>

    <section aria-labelledby="problem-title" className="mx-auto max-w-7xl px-5 py-20 md:px-10"><SectionLead eyebrow="THE PROBLEM" title="When identity can be generated, trust becomes a security problem." body="The new attack surface is human identity. TrustDNA shifts the question from “does this look fake?” to “does this belong to the person it claims to be?”" /><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{threats.map(({ icon: Icon, title, body }, index) => <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.045 }} key={title}><Card className="glass h-full border-white/[.08] transition duration-300 hover:-translate-y-1 hover:border-[#a998ff]/30"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-red-400/10 text-red-200"><Icon aria-hidden="true" className="size-5" /></span><h3 className="mt-6 text-base font-medium text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></CardContent></Card></motion.div>)}</div></section>

    <section aria-labelledby="workflow-title" className="border-y border-white/[.07] bg-[#090c25]/35 px-5 py-20 md:px-10"><div className="mx-auto max-w-7xl"><SectionLead eyebrow="HOW TRUSTDNA WORKS" title="From identity signals to a defensible trust decision." body="A clear evidence chain keeps every investigation explainable from the first artifact to the final certificate." /><div className="mt-12 grid gap-4 lg:grid-cols-5">{workflow.map(({ icon: Icon, title, body }, index) => <div className="relative" key={title}><Card className="glass h-full border-white/[.08]"><CardContent className="p-5"><span className="grid size-10 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#c2b7ff]"><Icon aria-hidden="true" className="size-5" /></span><p className="mt-6 font-mono text-[10px] tracking-[.15em] text-slate-600">0{index + 1}</p><h3 className="mt-2 text-sm font-medium text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></CardContent></Card>{index < workflow.length - 1 && <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-[#8474e9] lg:block" />}</div>)}</div></div></section>

    <section aria-labelledby="team-title" className="mx-auto max-w-7xl px-5 py-20 md:px-10"><SectionLead eyebrow="AI INVESTIGATION TEAM" title="Seven specialists. One evidence-backed case." body="TrustDNA names the work being done. Each investigator has a defined role; Sentinel orchestrates, while the Risk Engine decides." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{agents.map(({ icon: Icon, name, body }, index) => <motion.div whileHover={{ y: -5 }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.04 }} key={name}><Card className="glass h-full border-white/[.08] hover:border-[#a998ff]/35"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#8f7bfa]/15 text-[#c3b8ff]"><Icon aria-hidden="true" className="size-5" /></span><span className="size-1.5 rounded-full bg-[#a99bff] shadow-[0_0_10px_#a99bff]" /></div><h3 className="mt-6 text-base font-medium text-white">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></CardContent></Card></motion.div>)}</div></section>

    <section aria-labelledby="judge-preview-title" className="px-5 py-20 md:px-10"><div className="mx-auto grid max-w-7xl gap-7 overflow-hidden rounded-3xl border border-[#9c8aff]/25 bg-[linear-gradient(120deg,rgb(33_27_82_/_80%),rgb(11_16_45_/_88%))] p-6 md:p-9 lg:grid-cols-[.85fr_1.15fr] lg:p-12"><div><p className="text-xs font-medium tracking-[.18em] text-[#b9adff]">JUDGE MODE</p><h2 id="judge-preview-title" className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Experience TrustDNA in action.</h2><p className="mt-4 max-w-md text-sm leading-6 text-slate-300">No login. No setup. Choose a prepared case and watch Sentinel turn artifact signals into an explainable decision.</p><Button onClick={onStart} className="mt-7 h-11 rounded-xl bg-white px-5 text-[#17102f] hover:bg-[#ece9ff]">Try Judge Mode <ArrowRight className="size-4" /></Button></div><div className="grid gap-3 sm:grid-cols-2">{[{ icon: MailWarning, title: "Fake CEO Email", tag: "EMAIL" }, { icon: AudioLines, title: "Cloned Voice", tag: "VOICE" }, { icon: FileWarning, title: "Forged Resume", tag: "DOCUMENT" }, { icon: ShieldAlert, title: "Fake Certificate", tag: "CREDENTIAL" }].map(({ icon: Icon, title, tag }) => <button type="button" onClick={onStart} className="rounded-2xl border border-white/[.1] bg-white/[.035] p-5 text-left transition hover:-translate-y-1 hover:border-[#c0b4ff]/45 hover:bg-white/[.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c0b4ff]" key={title}><Icon aria-hidden="true" className="size-5 text-[#c0b4ff]" /><p className="mt-7 text-sm font-medium text-white">{title}</p><p className="mt-2 font-mono text-[10px] tracking-[.14em] text-slate-500">{tag}</p></button>)}</div></div></section>

    <section aria-labelledby="certificate-preview-title" className="border-y border-white/[.07] bg-[#090c25]/35 px-5 py-20 md:px-10"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><SectionLead eyebrow="TRUSTDNA CERTIFICATE" title="A trust credential people can actually share." body="Every concluded case can become a structured identity certificate—ready for verification, evidence review, and export." /><div className="mt-7 space-y-3 text-sm text-slate-400"><FeatureLine icon={BadgeCheck} text="Trust rating and identity confidence" /><FeatureLine icon={ShieldCheck} text="Evidence-linked verification status" /><FeatureLine icon={QrCodeMark} text="QR-ready public verification" /></div></div><CertificatePreview /></div></section>

    <section aria-labelledby="highlights-title" className="mx-auto max-w-7xl px-5 py-20 md:px-10"><SectionLead eyebrow="PRODUCT HIGHLIGHTS" title="Made for proof, not just detection." body="TrustDNA is a trust layer for high-stakes digital interactions across individuals, enterprises, and the AI internet." /><div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{highlights.map(({ icon: Icon, title, body }) => <Card className="glass border-white/[.08]" key={title}><CardContent className="p-5"><Icon aria-hidden="true" className="size-5 text-[#baaeff]" /><h3 className="mt-5 text-base font-medium text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{body}</p></CardContent></Card>)}</div></section>

    <section aria-labelledby="architecture-title" className="px-5 py-20 md:px-10"><div className="mx-auto max-w-7xl rounded-3xl border border-white/[.08] bg-[#080b21]/65 p-6 md:p-10"><SectionLead eyebrow="ARCHITECTURE" title="A transparent trust pipeline." body="Identity evidence moves through a deliberate, auditable system—not a black-box score." /><div className="mt-10 grid gap-4 md:grid-cols-5">{[{ icon: Fingerprint, label: "Identity Genome" }, { icon: ScanSearch, label: "Investigation" }, { icon: Network, label: "Agents" }, { icon: Workflow, label: "Risk Engine" }, { icon: BadgeCheck, label: "Certificate" }].map(({ icon: Icon, label }, index) => <div className="relative" key={label}><div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-5 text-center"><Icon aria-hidden="true" className="mx-auto size-5 text-[#b7abff]" /><p className="mt-4 text-sm font-medium text-slate-100">{label}</p></div>{index < 4 && <ArrowRight aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 text-[#8374ea] md:block" />}</div>)}</div></div></section>

    <section className="px-5 pb-24 pt-12 md:px-10"><div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[#9f8dff]/25 bg-[radial-gradient(circle_at_15%_20%,rgb(128_100_255_/_32%),transparent_25rem),linear-gradient(115deg,rgb(31_25_79),rgb(10_15_42))] px-6 py-14 text-center md:px-12"><Building2 aria-hidden="true" className="mx-auto size-7 text-[#c1b5ff]" /><h2 className="mt-6 text-3xl font-semibold tracking-tight text-white md:text-5xl">Ready to verify trust in the AI era?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">Open your first case. Let the evidence speak before the consequences do.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={onStart} className="h-12 rounded-xl bg-white px-5 text-[#17102f] hover:bg-[#ece9ff]">Start Investigation <ArrowRight className="size-4" /></Button><Button onClick={onStart} variant="outline" className="h-12 rounded-xl border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white">View Judge Demo</Button></div></div></section>
  </>;
}

function CasePreview() { return <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.08 }} className="glass relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-2xl shadow-black/30 md:p-7"><div aria-hidden="true" className="absolute -right-8 -top-8 size-40 rounded-full bg-[#7160ec]/25 blur-3xl" /><div className="relative flex items-center justify-between"><p className="font-mono text-xs text-[#aaa0ff]">LIVE CASE FILE</p><span className="rounded-full border border-red-300/20 bg-red-400/10 px-2.5 py-1 text-[10px] font-medium tracking-wider text-red-200">HIGH RISK</span></div><div className="relative mt-7 flex items-center gap-4"><div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#9b85ff] to-[#48bdf3] shadow-lg shadow-violet-500/30"><Fingerprint aria-hidden="true" className="size-7 text-white" /></div><div><p className="text-xl font-medium text-white">CASE #TDNA</p><p className="mt-1 text-sm text-slate-400">Suspicious CEO email</p></div></div><div className="relative mt-8 space-y-3">{["Writing signature conflicts with the Identity Genome", "Urgent financial request detected", "Timeline and source metadata conflict"].map((item) => <div className="flex items-start gap-3 rounded-xl border border-white/[.07] bg-[#090c25]/60 px-3 py-3" key={item}><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#a999ff]" /><p className="text-sm leading-5 text-slate-300">{item}</p></div>)}</div><div className="relative mt-7 flex items-end justify-between border-t border-white/10 pt-5"><div><p className="text-xs text-slate-500">VERDICT</p><p className="mt-1 text-sm font-medium text-red-200">Impersonation confirmed</p></div><p className="font-mono text-2xl font-semibold text-white">EVIDENCE</p></div></motion.div>; }
function CertificatePreview() { return <div className="glass relative overflow-hidden rounded-3xl border border-[#a791ff]/30 p-6 md:p-8"><div aria-hidden="true" className="absolute -right-14 -top-14 size-48 rounded-full bg-[#705ee7]/25 blur-3xl" /><div className="relative flex items-start justify-between"><div><p className="font-mono text-xs tracking-[.16em] text-[#b9adff]">TRUSTDNA AI</p><h3 id="certificate-preview-title" className="mt-2 text-2xl font-medium text-white">Identity Trust Certificate</h3></div><BadgeCheck aria-hidden="true" className="size-8 text-[#c0b5ff]" /></div><div className="relative mt-9 grid gap-4 sm:grid-cols-3"><PreviewMetric label="TRUST RATING" value="AAA" /><PreviewMetric label="IDENTITY" value="VERIFIED" /><PreviewMetric label="EVIDENCE" value="LINKED" /></div><div className="relative mt-8 grid gap-4 border-t border-white/[.1] pt-5 sm:grid-cols-[1fr_auto]"><div className="space-y-2 text-sm text-slate-400"><p>Structured case evidence</p><p>Versioned Identity Genome</p><p>Portable verification record</p></div><div className="grid size-20 place-items-center rounded-xl border border-white/10 bg-white/[.04]"><QrCodeMark className="size-10 text-slate-300" /></div></div></div>; }
function SectionLead({ body, eyebrow, title }: { body: string; eyebrow: string; title: string }) { return <div className="max-w-2xl"><p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">{eyebrow}</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2><p className="mt-4 text-sm leading-6 text-slate-400 md:text-base">{body}</p></div>; }
function FeatureLine({ icon: Icon, text }: { icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }>; text: string }) { return <div className="flex items-center gap-3"><Icon aria-hidden={true} className="size-4 text-[#b8adff]" /><span>{text}</span></div>; }
function PreviewMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="font-mono text-[10px] tracking-[.12em] text-slate-500">{label}</p><p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p></div>; }
function QrCodeMark({ className }: { "aria-hidden"?: boolean; className?: string }) { return <span aria-hidden="true" className={`relative grid grid-cols-3 gap-0.5 ${className ?? "size-4"}`}><i className="bg-current" /><i className="bg-current" /><i className="bg-current" /><i className="bg-current opacity-30" /><i className="bg-current" /><i className="bg-current" /><i className="bg-current" /><i className="bg-current opacity-30" /><i className="bg-current" /></span>; }
