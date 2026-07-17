"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, FileText, Fingerprint, GitFork, ImagePlus, Link2, Mail, Mic2, ShieldCheck, Sparkles, UploadCloud, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

const buildStages = ["Reviewing consented source selection", "Learning writing-style signals", "Mapping an explainable profile", "Preparing Guardian visualization", "Completing local preview"];

const sourceOptions = [
  { id: "resume", label: "Resume", detail: "PDF or DOCX", icon: FileText, accept: ".pdf,.doc,.docx" },
  { id: "writing", label: "Writing sample", detail: "TXT or document", icon: Fingerprint, accept: ".txt,.pdf,.doc,.docx" },
  { id: "portfolio", label: "Portfolio", detail: "Document or link export", icon: UploadCloud, accept: ".pdf,.txt,.doc,.docx" },
  { id: "voice", label: "Voice sample", detail: "Audio sample", icon: Mic2, accept: "audio/*" },
];

export function OnboardingWizard() {
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
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col"><header className="flex items-center justify-between"><Link href="/" aria-label="TrustDNA home"><BrandMark /></Link><span className="rounded-full border border-amber-200/15 bg-amber-300/[.06] px-3 py-1 font-mono text-[9px] tracking-[.13em] text-amber-100">LOCAL PREVIEW · NOT PERSISTED</span></header>
        <div className="my-auto py-10"><div className="mx-auto max-w-3xl"><div aria-label={`Step ${step + 1} of 5`} className="mb-8 flex items-center gap-2">{[0, 1, 2, 3, 4].map((index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#9a86fa]" : "bg-white/[.08]"}`} />)}</div><section className="glass overflow-hidden rounded-3xl border border-white/[.12] p-6 shadow-2xl shadow-black/30 md:p-10">{step === 0 && <Welcome onContinue={next} />}{step === 1 && <PhotoStep photoName={photoName} photoPreview={photoPreview} onPhoto={handlePhoto} onBack={previous} onContinue={next} />}{step === 2 && <SourcesStep sourceFiles={sourceFiles} onSource={handleSource} onBack={previous} onContinue={next} />}{step === 3 && <BuildStep progress={progress} onBack={previous} onContinue={next} />}{step === 4 && <AwakenStep onBack={previous} />}</section><div className="mt-5 text-center text-xs leading-5 text-slate-500">This wizard never uploads or persists files in the current deployment. It previews the future authenticated Identity Genome flow without claiming backend completion.</div></div></div>
      </div>
    </main>
  );
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  return <div className="max-w-2xl"><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 01 · WELCOME</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white md:text-5xl">Meet your Identity Genome.</h1><p className="mt-5 text-base leading-7 text-slate-300">TrustDNA turns consented digital signals into an explainable identity foundation. It is not a surveillance profile: you choose the sources, can see what they contribute, and can remove them.</p><div className="mt-8 grid gap-3 sm:grid-cols-3"><Promise icon={Fingerprint} label="Explainable" body="Signals remain inspectable." /><Promise icon={ShieldCheck} label="Consent-led" body="You decide what connects." /><Promise icon={BadgeCheck} label="Versioned" body="Cases reference the genome used." /></div><Button onClick={onContinue} className="mt-9 h-12 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]">Begin setup <ArrowRight className="size-4" /></Button></div>;
}

function PhotoStep({ photoName, photoPreview, onPhoto, onBack, onContinue }: { photoName: string | null; photoPreview: string | null; onPhoto: (event: ChangeEvent<HTMLInputElement>) => void; onBack: () => void; onContinue: () => void }) {
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 02 · PROFILE IMAGE</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Give the Guardian a visual anchor.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Optional in the future production flow. This local preview never transmits your image; it is only shown in this browser session.</p><label className="mt-8 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#b2a7ff]/30 bg-[#8f7bfa]/[.05] p-6 text-center transition hover:border-[#bcb2ff]/60 hover:bg-[#8f7bfa]/10"><input onChange={onPhoto} type="file" accept="image/*" className="sr-only" />{photoPreview ? <span role="img" aria-label="Selected local profile preview" className="size-28 rounded-full border border-white/20 bg-cover bg-center shadow-xl shadow-[#8f7bfa]/20" style={{ backgroundImage: `url("${photoPreview}")` }} /> : <span className="grid size-16 place-items-center rounded-2xl bg-[#8f7bfa]/15 text-[#bdb2ff]"><ImagePlus aria-hidden="true" className="size-7" /></span>}<p className="mt-5 text-sm font-medium text-white">{photoName ?? "Choose a profile photo"}</p><p className="mt-2 text-xs text-slate-500">PNG, JPG, or WEBP · local preview only</p></label><WizardControls onBack={onBack} onContinue={onContinue} continueDisabled={!photoName} continueLabel="Continue" /></div>;
}

function SourcesStep({ sourceFiles, onSource, onBack, onContinue }: { sourceFiles: Record<string, string>; onSource: (id: string, event: ChangeEvent<HTMLInputElement>) => void; onBack: () => void; onContinue: () => void }) {
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 03 · IDENTITY SOURCES</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Choose the evidence you control.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Select the sources that may eventually inform your Identity Genome. Files remain only in this local preview until authenticated ingestion is configured.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{sourceOptions.map(({ id, label, detail, icon: Icon, accept }) => <label key={id} className="cursor-pointer rounded-2xl border border-white/[.08] bg-black/10 p-4 transition hover:border-[#b3a7ff]/35 hover:bg-white/[.035]"><input onChange={(event) => onSource(id, event)} type="file" accept={accept} className="sr-only" /><Icon aria-hidden="true" className="size-5 text-[#b8adff]" /><div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs text-slate-500">{sourceFiles[id] ?? detail}</p></div>{sourceFiles[id] && <Check aria-hidden="true" className="size-4 text-emerald-300" />}</div></label>)}</div><div className="mt-5 rounded-2xl border border-white/[.06] bg-white/[.02] p-4"><p className="font-mono text-[10px] tracking-[.14em] text-slate-600">INTEGRATIONS</p><div className="mt-3 flex flex-wrap gap-2">{[{ label: "Google Drive", icon: UploadCloud }, { label: "GitHub", icon: GitFork }, { label: "LinkedIn", icon: Link2 }, { label: "Gmail", icon: Mail }].map(({ label, icon: Icon }) => <span key={label} className="flex items-center gap-1.5 rounded-lg border border-white/[.08] px-2.5 py-1.5 text-xs text-slate-600"><Icon aria-hidden="true" className="size-3.5" />{label} · Coming soon</span>)}</div></div><WizardControls onBack={onBack} onContinue={onContinue} continueLabel="Build preview" /></div>;
}

function BuildStep({ progress, onBack, onContinue }: { progress: number; onBack: () => void; onContinue: () => void }) {
  const ready = progress >= buildStages.length;
  return <div><p className="font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 04 · GENOME PREVIEW</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">Preparing your Guardian experience.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">These steps animate the product experience only. No files are uploaded, no Identity Genome is persisted, and no AI is trained in this preview deployment.</p><div className="mt-8 space-y-3">{buildStages.map((stage, index) => <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${index < progress ? "border-[#a79cff]/25 bg-[#8e7af6]/10 text-slate-200" : "border-white/[.07] bg-black/10 text-slate-600"}`} key={stage}><span className={`grid size-6 place-items-center rounded-full border ${index < progress ? "border-[#b9afff]/50 text-[#c2b9ff]" : "border-white/[.1]"}`}>{index < progress ? <Check aria-hidden="true" className="size-3.5" /> : <span className="font-mono text-[10px]">0{index + 1}</span>}</span>{stage}</div>)}</div><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full bg-gradient-to-r from-[#8d78f6] to-[#64d0ff] transition-all duration-500" style={{ width: `${(progress / buildStages.length) * 100}%` }} /></div><WizardControls onBack={onBack} onContinue={onContinue} continueDisabled={!ready} continueLabel={ready ? "Awaken Guardian" : "Preparing…"} /></div>;
}

function AwakenStep({ onBack }: { onBack: () => void }) {
  return <div className="text-center"><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-[#a38eff] to-[#58c8f7] text-white shadow-xl shadow-violet-600/20"><Sparkles aria-hidden="true" className="size-7" /></span><p className="mt-7 font-mono text-[11px] tracking-[.17em] text-[#b8adff]">STEP 05 · GUARDIAN READY</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-white">Your Identity Guardian preview is ready.</h1><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">You can now explore the dashboard experience. An actual Guardian becomes active only when an authenticated Identity Genome and monitoring service are connected.</p><div className="mt-8 rounded-2xl border border-amber-200/12 bg-amber-300/[.05] p-4 text-left text-xs leading-5 text-amber-100"><strong className="font-medium">Nothing was saved.</strong> This preview has not created an account, uploaded sources, or issued an Identity Genome.</div><div className="mt-8 flex flex-wrap justify-center gap-3"><Button asChild className="h-12 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]"><Link href="/dashboard">Enter platform preview <ArrowRight className="size-4" /></Link></Button><Button onClick={onBack} variant="outline" className="h-12 rounded-xl border-white/[.12] bg-transparent text-slate-200 hover:bg-white/[.05] hover:text-white"><ArrowLeft className="size-4" />Back</Button></div></div>;
}

function Promise({ icon: Icon, label, body }: { icon: LucideIcon; label: string; body: string }) { return <div className="rounded-xl border border-white/[.08] bg-black/10 p-4"><Icon aria-hidden="true" className="size-4 text-[#b8adff]" /><p className="mt-4 text-sm font-medium text-white">{label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>; }
function WizardControls({ onBack, onContinue, continueDisabled = false, continueLabel }: { onBack: () => void; onContinue: () => void; continueDisabled?: boolean; continueLabel: string }) { return <div className="mt-8 flex items-center justify-between gap-3"><Button onClick={onBack} variant="ghost" className="text-slate-400 hover:bg-white/[.04] hover:text-white"><ArrowLeft className="size-4" />Back</Button><Button onClick={onContinue} disabled={continueDisabled} className="h-11 rounded-xl bg-[#8b78f6] text-white hover:bg-[#9d8cff]">{continueLabel}<ArrowRight className="size-4" /></Button></div>; }
