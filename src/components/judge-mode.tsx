import { FileBadge, FileText, Mail, Mic, Play, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { judgeScenarios } from "@/features/judge/scenarios";
import type { Scenario } from "@/features/judge/types";

const icons = { mail: Mail, mic: Mic, file: FileText, certificate: FileBadge };

type JudgeModeProps = {
  selected: Scenario;
  onSelect: (scenario: Scenario) => void;
  onStart: () => void;
  disabled: boolean;
};

export function JudgeMode({ selected, onSelect, onStart, disabled }: JudgeModeProps) {
  return <section id="judge-mode" aria-labelledby="judge-mode-title" className="mx-auto w-full max-w-7xl scroll-mt-6 px-5 py-20 md:px-10"><div className="mb-9 max-w-2xl"><p className="text-xs font-medium tracking-[.18em] text-[#aaa0ff]">JUDGE MODE</p><h2 id="judge-mode-title" className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Run an investigation in one click.</h2><p className="mt-3 text-sm leading-6 text-slate-400">No login. No setup. Choose a deterministic case and watch the forensic workflow unfold against a real API.</p></div><div role="group" aria-label="Choose an investigation scenario" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{judgeScenarios.map((scenario) => { const Icon = icons[scenario.icon]; const active = scenario.id === selected.id; return <button key={scenario.id} type="button" aria-pressed={active} disabled={disabled} onClick={() => onSelect(scenario)} className={`rounded-2xl text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b8abff] disabled:cursor-not-allowed ${active ? "scale-[1.015]" : "hover:-translate-y-0.5"}`}><Card className={`glass h-full border ${active ? "border-[#a491ff]/75 shadow-[0_0_0_1px_rgb(164_145_255/.25)]" : "border-white/10"}`}><CardContent className="p-5"><div className="flex items-center justify-between"><span className={`grid size-10 place-items-center rounded-xl ${active ? "bg-[#896ff3]/25 text-[#c0b4ff]" : "bg-white/[.06] text-slate-400"}`}><Icon aria-hidden="true" className="size-5" /></span>{active && <span aria-hidden="true" className="size-2 rounded-full bg-[#9e89ff] shadow-[0_0_12px_#9e89ff]" />}</div><p className="mt-6 font-medium text-white">{scenario.title}</p><p className="mt-1 text-sm text-slate-500">{scenario.subject}</p></CardContent></Card></button>; })}</div><div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-red-400/10 text-red-200"><ShieldAlert aria-hidden="true" className="size-4" /></span><div aria-live="polite"><p className="text-sm font-medium text-slate-100">Selected: {selected.title}</p><p className="text-xs text-slate-500">Artifact: {selected.artifactReference}</p></div></div><Button disabled={disabled} onClick={onStart} className="h-11 rounded-xl bg-[#8b78f6] px-5 text-white hover:bg-[#9d8cff]" aria-describedby="judge-mode-status"><Play aria-hidden="true" className="size-4" />{disabled ? "Investigation running" : "Start Investigation"}</Button><span id="judge-mode-status" className="sr-only">{disabled ? "The active investigation is in progress. Scenario selection is temporarily unavailable." : "Starting an investigation sends this demo artifact through the TrustDNA backend."}</span></div></section>;
}
