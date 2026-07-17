"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, FileText, Fingerprint, GitFork, ImagePlus, Link2, Mail, Mic2, ShieldCheck, Sparkles, UploadCloud, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/components/auth-provider";
import { markOnboardingComplete } from "@/features/auth/provider";

const buildStages = ["Learning your writing style", "Mapping behavioral signals", "Creating your Identity Genome", "Awakening your Guardian", "Securing your trust layer"];

const sourceOptions = [
  { id: "resume", label: "Resume", detail: "PDF or DOCX", icon: FileText, accept: ".pdf,.doc,.docx" },
  { id: "writing", label: "Writing sample", detail: "TXT or document", icon: Fingerprint, accept: ".txt,.pdf,.doc,.docx" },
  { id: "portfolio", label: "Portfolio", detail: "Document or link export", icon: UploadCloud, accept: ".pdf,.txt,.doc,.docx" },
  { id: "voice", label: "Voice sample", detail: "Audio sample", icon: Mic2, accept: "audio/*" },
];

export function OnboardingWizard() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sourceFiles, setSourceFiles] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  useEffect(() => {
    if (step !== 3) return;
    const timer = window.setInterval(() => setProgress((current) => Math.min(current + 1, buildStages.length)), 720);
    return () => window.clearInterval(timer);
  }, [step]);

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoName(file.name);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleSource(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSourceFiles((current) => ({ ...current, [id]: file.name }));
  }

  const next = () => setStep((current) => Math.min(current + 1, 4));
  const previous = () => setStep((current) => Math.max(current - 1, 0));

  return (
    <main className="app-backdrop min-h-screen px-5 py-5 md:px-10">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col"><header className="flex items-center justify-between"><Link href="/" aria-label="TrustDNA home"><BrandMark /></Link><span className="rounded-full border border-[#a99bff]/20 bg-[#8f7bfa]/10 px-3 py-1 font-mono text-[9px] tracking-[.13em] text-[#c1b7ff]">SECURE SETUP</span></header>
        <div className="my-auto py-10"><div className="mx-auto max-w-3xl"><div aria-label={`Step ${step + 1} of 5`} className="mb-8 flex items-center gap-2">{[0, 1, 2, 3, 4].map((index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#9a86fa]" : "bg-white/[.08]"}`} />)}</div><section className="glass overflow-hidden rounded-3xl border border-white/[.12] p-6 shadow-2xl shadow-black/30 md:p-10">{step === 0 && <Welcome onContinue={next} />}{step === 1 && <PhotoStep photoName={photoName} photoPreview={photoPreview} onPhoto={handlePhoto} onBack={previous} onContinue={next} />}{step === 2 && <SourcesStep sourceFiles={sourceFiles} onSource={handleSource} onBack={previous} onContinue={next} />}{step === 3 && <BuildStep progress={progress} onBack={previous} onContinue={next} />}{step === 4 && <AwakenStep onBack={previous} user={user} onComplete={markOnboardingComplete} refreshProfile={refreshProfile} onDashboard={() => router.replace("/dashboard")} />}</section><div className="mt-5 text-center text-xs leading-5 text-slate-500">Your Identity Genome is built around consent, transparency, and your control.</div></div></div>
      </div>
    </main>
  );
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  return <div className="max-w-2xl"><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 01 · WELCOME</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white md:text-5xl">Meet your Identity Genome.</h1><p className="mt-5 text-base leading-7 text-slate-300">TrustDNA turns consented digital signals into an explainable identity foundation. It is not a surveillance profile: you choose the sources, can see what they contribute, and can remove them.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><Promise icon={Fingerprint} label="Explainable" body="Signals remain inspectable." /><Promise icon={ShieldCheck} label="Consent-led" body="You decide what connects." /><Promise icon={BadgeCheck} label="Versioned" body="Cases reference the genome used." /></div><Button onClick={onContinue} className="mt-9 h-12 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]">Begin setup <ArrowRight className="size-4" /></Button></div>;
}

function PhotoStep({ photoName, photoPreview, onPhoto, onBack, onContinue }: { photoName: string | null; photoPreview: string | null; onPhoto: (event: ChangeEvent<HTMLInputElement>) => void; onBack: () => void; onContinue: () => void }) {
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 02 · PROFILE IMAGE</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Give the Guardian a visual anchor.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Add a profile image to make your Guardian feel unmistakably yours. Your identity remains under your control.</p><label className="mt-8 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#b2a7ff]/30 bg-[#8f7bfa]/[.05] p-6 text-center transition hover:border-[#bcb2ff]/60 hover:bg-[#8f7bfa]/10"><input onChange={onPhoto} type="file" accept="image/*" className="sr-only" />{photoPreview ? <span role="img" aria-label="Selected profile image" className="size-28 rounded-full border border-white/20 bg-cover bg-center shadow-xl shadow-[#8f7bfa]/20" style={{ backgroundImage: `url("${photoPreview}")` }} /> : <span className="grid size-16 place-items-center rounded-2xl bg-[#8f7bfa]/15 text-[#bdb2ff]"><ImagePlus aria-hidden="true" className="size-7" /></span>}<p className="mt-5 text-sm font-medium text-white">{photoName ?? "Choose a profile photo"}</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, or WEBP</p></label><WizardControls onBack={onBack} onContinue={onContinue} continueDisabled={!photoName} continueLabel="Continue" /></div>;
}

function SourcesStep({ sourceFiles, onSource, onBack, onContinue }: { sourceFiles: Record<string, string>; onSource: (id: string, event: ChangeEvent<HTMLInputElement>) => void; onBack: () => void; onContinue: () => void }) {
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 03 · IDENTITY SOURCES</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Choose the evidence you control.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Select the sources you want your Identity Genome to understand. Every signal is designed to make trust decisions more transparent.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{sourceOptions.map(({ id, label, detail, icon: Icon, accept }) => <label key={id} className="cursor-pointer rounded-2xl border border-white/[.08] bg-black/10 p-4 transition hover:border-[#b3a7ff]/35 hover:bg-white/[.035]"><input onChange={(event) => onSource(id, event)} type="file" accept={accept} className="sr-only" /><Icon aria-hidden="true" className="size-5 text-[#b8adff]" /><div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs text-slate-500">{sourceFiles[id] ?? detail}</p></div>{sourceFiles[id] && <Check aria-hidden="true" className="size-4 text-emerald-300" />}</div></label>)}</div><div className="mt-5 rounded-2xl border border-white/[.06] bg-white/[.02] p-4"><p className="font-mono text-[10px] tracking-[.14em] text-slate-600">CONNECTED SOURCES</p><div className="mt-3 flex flex-wrap gap-2">{[{ label: "Google Drive", icon: UploadCloud }, { label: "GitHub", icon: GitFork }, { label: "LinkedIn", icon: Link2 }, { label: "Gmail", icon: Mail }].map(({ label, icon: Icon }) => <span key={label} className="flex items-center gap-1.5 rounded-lg border border-white/[.08] px-2.5 py-1.5 text-xs text-slate-600"><Icon aria-hidden="true" className="size-3.5" />{label} · Coming soon</span>)}</div></div><WizardControls onBack={onBack} onContinue={onContinue} continueLabel="Build Identity Genome" /></div>;
}

function BuildStep({ progress, onBack, onContinue }: { progress: number; onBack: () => void; onContinue: () => void }) {
  const ready = progress >= buildStages.length;
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 04 · IDENTITY GENOME</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Your Guardian is coming to life.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Genesis is preparing the explainable trust layer that helps protect your identity across every future investigation.</p><div className="mt-8 space-y-3">{buildStages.map((stage, index) => <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${index < progress ? "border-[#a79cff]/25 bg-[#8e7af6]/10 text-slate-200" : "border-white/[.07] bg-black/10 text-slate-600"}`} key={stage}><span className={`grid size-6 place-items-center rounded-full border ${index < progress ? "border-[#b9afff]/50 text-[#c2b9ff]" : "border-white/[.1]"}`}>{index < progress ? <Check aria-hidden="true" className="size-3.5" /> : <span className="font-mono text-[10px]">0{index + 1}</span>}</span>{stage}</div>)}</div><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full bg-gradient-to-r from-[#8d78f6] to-[#64d0ff] transition-all duration-500" style={{ width: `${(progress / buildStages.length) * 100}%` }} /></div><WizardControls onBack={onBack} onContinue={onContinue} continueDisabled={!ready} continueLabel={ready ? "Awaken Guardian" : "Preparing…"} /></div>;
}

function AwakenStep({ onBack, user, onComplete, refreshProfile, onDashboard }: { onBack: () => void; user: ReturnType<typeof useAuth>["user"]; onComplete: typeof markOnboardingComplete; refreshProfile: ReturnType<typeof useAuth>["refreshProfile"]; onDashboard: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enterWorkspace() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const complete = await onComplete(user);
    if (!complete) {
      setSaving(false);
      setError("We couldn’t finish setting up your workspace. Please try again.");
      return;
    }
    await refreshProfile();
    onDashboard();
  }

  return <div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#a38eff] to-[#58c8f7] text-white shadow-xl shadow-violet-600/20"><Sparkles aria-hidden="true" className="size-7" /></span><p className="mt-7 font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 05 · GUARDIAN READY</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white">Your Identity Guardian is ready.</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">Your TrustDNA workspace is ready for protected investigations, evidence-backed decisions, and a stronger digital identity.</p>{error && <p role="status" className="mx-auto mt-6 max-w-xl rounded-xl border border-red-200/15 bg-red-300/[.07] p-4 text-left text-sm text-red-100">{error}</p>}<div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={enterWorkspace} disabled={saving} className="h-12 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]">{saving ? "Setting up your workspace…" : "Enter Dashboard"}<ArrowRight className="size-4" /></Button><Button onClick={onBack} disabled={saving} variant="outline" className="h-12 rounded-xl border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.05] hover:text-white"><ArrowLeft className="size-4" />Back</Button></div></div>;
}

function Promise({ icon: Icon, label, body }: { icon: LucideIcon; label: string; body: string }) { return <div className="rounded-xl border border-white/[.08] bg-black/10 p-4"><Icon aria-hidden="true" className="size-4 text-[#b8adff]" /><p className="mt-4 text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>; }
function WizardControls({ onBack, onContinue, continueDisabled = false, continueLabel }: { onBack: () => void; onContinue: () => void; continueDisabled?: boolean; continueLabel: string }) { return <div className="mt-8 flex items-center justify-between gap-3"><Button onClick={onBack} variant="ghost" className="text-slate-400 hover:bg-white/[.04] hover:text-white"><ArrowLeft className="size-4" />Back</Button><Button onClick={onContinue} disabled={continueDisabled} className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]">{continueLabel}<ArrowRight className="size-4" /></Button></div>; }
