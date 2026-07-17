"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUp, Bot, CheckCircle2, Sparkles } from "lucide-react";
import type { TwinConversationMessage } from "@/features/identity-twin/types";

type TwinConversationProps = {
  messages: TwinConversationMessage[];
  question: string;
  isProcessing: boolean;
  hasEvidence: boolean;
  suggestedQuestions: string[];
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  onSuggestedQuestion: (question: string) => void;
};

export function TwinConversation({
  messages,
  question,
  isProcessing,
  hasEvidence,
  suggestedQuestions,
  onQuestionChange,
  onSubmit,
  onSuggestedQuestion,
}: TwinConversationProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <section aria-labelledby="twin-conversation-heading" className="glass flex min-h-[42rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/[.1]">
      <div className="border-b border-white/[.07] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">PRIVATE EVIDENCE CONVERSATION</p>
            <h2 id="twin-conversation-heading" className="mt-1 text-lg font-medium text-white">Ask your Identity Twin</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[.12em] ${hasEvidence ? "border-cyan-300/20 bg-cyan-300/[.08] text-cyan-100" : "border-amber-300/20 bg-amber-300/[.08] text-amber-100"}`}>
            <span aria-hidden="true" className={`size-1.5 rounded-full ${hasEvidence ? "bg-cyan-300 shadow-[0_0_10px_#67e8f9]" : "bg-amber-200"}`} />
            {hasEvidence ? "GENOME LINKED" : "AWAITING EVIDENCE"}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Answers are constrained to the current Identity Genome. Unknown evidence stays unknown.</p>
      </div>

      <div aria-live="polite" aria-relevant="additions text" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        {messages.map((message) => <ConversationMessage key={message.id} message={message} />)}
        {isProcessing && <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#a99bff]/15 bg-[#8d79f7]/[.06] p-3 text-xs text-[#d0caff]"><span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-[#c6beff] shadow-[0_0_12px_#c6beff]" />Guardian is correlating the selected evidence.</div>}
      </div>

      <div className="border-t border-white/[.07] bg-black/[.08] px-5 py-4 sm:px-6">
        <div aria-label="Suggested Identity Twin questions" className="flex gap-2 overflow-x-auto pb-2">
          {suggestedQuestions.map((suggestion) => <button key={suggestion} type="button" disabled={isProcessing} onClick={() => onSuggestedQuestion(suggestion)} className="shrink-0 rounded-full border border-white/[.09] bg-white/[.025] px-3 py-1.5 text-left text-[11px] text-slate-300 transition hover:border-[#b7adff]/35 hover:bg-[#8d79f7]/[.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{suggestion}</button>)}
        </div>
        <form onSubmit={handleSubmit} className="mt-2 flex items-end gap-3" aria-busy={isProcessing}>
          <label className="sr-only" htmlFor="twin-question">Ask your Identity Twin</label>
          <textarea id="twin-question" value={question} onChange={(event) => onQuestionChange(event.target.value)} onKeyDown={handleKeyDown} disabled={isProcessing} rows={2} placeholder={hasEvidence ? "Ask about the evidence in your Identity Genome…" : "Ask what evidence TrustDNA needs to know…"} className="min-h-12 flex-1 resize-none rounded-2xl border border-white/[.1] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a99bff]/55 focus:ring-2 focus:ring-[#8d79f7]/20 disabled:cursor-not-allowed disabled:opacity-60" />
          <button type="submit" disabled={isProcessing || !question.trim()} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#8b78f6] text-white shadow-lg shadow-[#5f4ac8]/20 transition hover:bg-[#9c8aff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6beff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0c21] disabled:cursor-not-allowed disabled:opacity-45" aria-label="Send question to Identity Twin"><ArrowUp aria-hidden="true" className="size-5" /></button>
        </form>
        <p className="mt-2 text-[10px] text-slate-600">Enter to send · Shift + Enter for a new line</p>
      </div>
    </section>
  );
}

function ConversationMessage({ message }: { message: TwinConversationMessage }) {
  if (message.role === "user") {
    return <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#8170e8] px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-[#4d3ba8]/15">{message.content}</div>;
  }

  const response = message.response;
  return <div className="max-w-[94%] rounded-2xl rounded-bl-md border border-white/[.09] bg-white/[.025] p-4 text-sm leading-6 text-slate-200"><div className="flex items-center gap-2 text-[10px] font-medium tracking-[.13em] text-[#c7c0ff]"><Bot aria-hidden="true" className="size-3.5" />IDENTITY TWIN</div><p className="mt-2 whitespace-pre-wrap">{message.content}</p>{response && <div className="mt-4 grid gap-2 border-t border-white/[.07] pt-3 sm:grid-cols-2"><ResponseMetric label="Confidence" value={response.confidenceLabel} /><ResponseMetric label="Evidence used" value={`${response.evidenceUsed.length} item${response.evidenceUsed.length === 1 ? "" : "s"}`} /></div>}{response && response.confidence === null && <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-2.5 text-xs leading-5 text-amber-50"><Sparkles aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-amber-200" />TrustDNA withheld a conclusion until it has direct evidence.</div>}{response && response.confidence !== null && <div className="mt-3 flex items-center gap-2 text-xs text-cyan-100"><CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" />Evidence boundary preserved</div>}</div>;
}

function ResponseMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-black/[.14] px-3 py-2"><p className="font-mono text-[8px] tracking-[.13em] text-slate-600">{label.toUpperCase()}</p><p className="mt-1 text-xs font-medium text-slate-200">{value}</p></div>;
}
