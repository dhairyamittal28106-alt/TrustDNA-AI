import { Check, Circle, LoaderCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

type InvestigationConsoleProps = { activeStep: number; caseNumber?: string };

const steps = [
  { actor: "Sentinel", action: "Opening case and establishing chain of custody" },
  { actor: "Sentinel", action: "Collecting evidence and classifying artifact" },
  { actor: "Genesis", action: "Reconstructing the Identity Genome" },
  { actor: "Cipher", action: "Comparing the writing signature" },
  { actor: "Chronos", action: "Validating the identity timeline" },
  { actor: "ForensIQ", action: "Inspecting deterministic forensic signals" },
  { actor: "Risk Engine", action: "Correlating evidence and assessing risk" },
  { actor: "Atlas", action: "Generating the evidence report and certificate" },
];

export function InvestigationConsole({ activeStep, caseNumber }: InvestigationConsoleProps) {
  const finished = activeStep >= steps.length;
  const progress = Math.min(((activeStep + 1) / steps.length) * 100, 100);
  const currentStep = steps[Math.min(activeStep, steps.length - 1)];

  return <section aria-labelledby="investigation-title" className="mx-auto w-full max-w-4xl px-5 py-8 md:px-10"><Card className="glass overflow-hidden border-[#9885fb]/25"><CardContent className="p-6 md:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-xs tracking-[.16em] text-[#aaa0ff]">LIVE INVESTIGATION</p><h2 id="investigation-title" className="mt-2 text-2xl font-semibold text-white">{caseNumber ?? "CASE INITIALIZING"}</h2></div><div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${finished ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-[#a791ff]/20 bg-[#8a70f4]/10 text-[#c6bcff]"}`}>{finished ? <ShieldCheck aria-hidden="true" className="size-3.5" /> : <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />}{finished ? "Evidence correlated" : "Sentinel coordinating"}</div></div><div className="mt-6"><div className="flex items-center justify-between font-mono text-[10px] tracking-[.12em] text-slate-500"><span>INVESTIGATION PROGRESS</span><span>{Math.round(progress)}%</span></div><div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-white/[.07]"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#8372ef] to-[#45b8ff]" animate={{ width: `${progress}%` }} transition={{ duration: .35, ease: "easeOut" }} /></div></div><div aria-live="polite" aria-atomic="true" className="sr-only">{finished ? "Investigation complete. Evidence has been correlated and the verdict is ready." : `${currentStep.actor}: ${currentStep.action}`}</div><div className="relative mt-8 space-y-0">{steps.map((step, index) => { const complete = index < activeStep || finished; const current = index === activeStep && !finished; return <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * .04 }} className="relative flex gap-4 pb-5" key={`${step.actor}-${step.action}`}><div className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-[#101431]">{complete ? <Check aria-hidden="true" className="size-4 text-emerald-300" /> : current ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin text-[#b5a7ff]" /> : <Circle aria-hidden="true" className="size-2 text-slate-600" />}</div>{index < steps.length - 1 && <div aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-8px)] w-px bg-white/[.08]" />}<div className="pt-0.5"><p className={`text-sm ${complete || current ? "text-slate-100" : "text-slate-600"}`}><span className="font-medium">{step.actor}</span><span className="text-slate-400"> — {step.action}</span></p><p className="mt-1 font-mono text-[10px] tracking-[.12em] text-slate-600">{complete ? "COMPLETE" : current ? "ANALYSING" : "QUEUED"}</p></div></motion.div>; })}</div><div className="mt-2 flex items-center gap-2 border-t border-white/[.08] pt-5 text-xs text-slate-500"><ShieldCheck aria-hidden="true" className="size-4 text-[#a899ff]" />Evidence is correlated against a versioned Identity Genome.</div></CardContent></Card></section>;
}
