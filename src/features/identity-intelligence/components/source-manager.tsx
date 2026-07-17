"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileCode2,
  FileText,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  connectorSources,
  formatSources,
  primarySources,
  textReadySources,
} from "@/features/identity-intelligence/source-registry";
import type { SourceDefinition } from "@/features/identity-intelligence/types";

export type SourceManagerProps = {
  onIngest: (input: {
    content: string;
    sourceId: string;
    sourceLabel: string;
  }) => Promise<void>;
  busy: boolean;
};

const defaultSource = textReadySources[0] ?? null;

function sourceIcon(source: SourceDefinition) {
  if (source.id === "writing-sample" || source.id === "personal-notes") {
    return FileCode2;
  }

  return FileText;
}

function extensionlessName(filename: string): string {
  return filename.replace(/\.(txt|md)$/i, "");
}

function isSupportedTextFile(file: File): boolean {
  return /\.(txt|md)$/i.test(file.name);
}

function plannedSourceLabel(source: SourceDefinition): string {
  return source.kind === "connector" ? "Connector · Coming soon" : "Coming soon";
}

export function SourceManager({ onIngest, busy }: SourceManagerProps) {
  const [sourceId, setSourceId] = useState(defaultSource?.id ?? "");
  const [sourceLabel, setSourceLabel] = useState(defaultSource?.label ?? "");
  const [content, setContent] = useState("");
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSource = textReadySources.find((source) => source.id === sourceId) ?? null;
  const plannedPrimarySources = primarySources.filter(
    (source) => source.availability === "coming_soon",
  );
  const plannedFormatSources = formatSources.filter(
    (source) => source.availability === "coming_soon",
  );

  function selectSource(source: SourceDefinition) {
    setSourceId(source.id);
    setSourceLabel(source.label);
    setError(null);
    setSuccess(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (!isSupportedTextFile(file)) {
      setSelectedFilename(null);
      event.currentTarget.value = "";
      setError("Choose a .txt or .md file. PDF and DOCX extraction are coming soon.");
      return;
    }

    try {
      const fileContent = await file.text();
      if (!fileContent.trim()) {
        setSelectedFilename(null);
        event.currentTarget.value = "";
        setError("This file does not contain readable text. Choose another text file or paste your content.");
        return;
      }

      setContent(fileContent);
      setSelectedFilename(file.name);
      setSourceLabel(extensionlessName(file.name) || selectedSource?.label || "Text source");
    } catch {
      setSelectedFilename(null);
      event.currentTarget.value = "";
      setError("We could not read that file. Please paste the text instead.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedContent = content.trim();
    const trimmedLabel = sourceLabel.trim();

    if (!selectedSource) {
      setError("Choose a text-ready source before adding evidence.");
      return;
    }

    if (!trimmedLabel) {
      setError("Give this source a clear label so it stays explainable in your Genome.");
      return;
    }

    if (!trimmedContent) {
      setError("Paste text or import a .txt or .md file to continue.");
      return;
    }

    try {
      await onIngest({
        content: trimmedContent,
        sourceId: selectedSource.id,
        sourceLabel: trimmedLabel,
      });
      setContent("");
      setSelectedFilename(null);
      setSourceLabel(selectedSource.label);
      setSuccess(`${trimmedLabel} was added for deterministic extraction.`);
    } catch {
      setError("We could not add this source. Please try again.");
    }
  }

  return (
    <section
      aria-labelledby="source-manager-title"
      id="genome-source-manager"
      className="glass rounded-3xl border border-white/[.1] bg-slate-950/45 p-5 shadow-[0_20px_80px_-36px_rgba(96,165,250,.45)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-[#b9afff]">
            <Sparkles aria-hidden="true" className="size-3.5" />
            IDENTITY SOURCES
          </div>
          <h2 id="source-manager-title" className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Add evidence you control.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Submit consented plain text to create explainable Identity Genome signals. Source connections and media extraction stay disabled until their dedicated extractors are available.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-sky-300/10 bg-sky-300/[.05] px-3 py-2 text-xs text-slate-300">
          <LockKeyhole aria-hidden="true" className="size-3.5 text-sky-200" />
          Consent-led intake
        </div>
      </div>

      <form className="mt-7 space-y-6" onSubmit={handleSubmit} aria-busy={busy}>
        <fieldset>
          <legend className="text-sm font-medium text-slate-100">1. Choose the evidence type</legend>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            These sources accept plain text today and contribute only evidence-backed traits.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {textReadySources.map((source) => {
              const Icon = sourceIcon(source);
              const selected = source.id === sourceId;

              return (
                <label
                  key={source.id}
                  className={`group relative flex min-h-32 cursor-pointer flex-col rounded-2xl border p-4 transition focus-within:ring-2 focus-within:ring-[#a99bff]/60 ${
                    selected
                      ? "border-[#a99bff]/55 bg-[#8976f2]/[.12] shadow-[inset_0_0_36px_rgba(139,120,246,.08)]"
                      : "border-white/[.08] bg-black/10 hover:border-[#a99bff]/30 hover:bg-white/[.035]"
                  } ${busy ? "cursor-not-allowed opacity-65" : ""}`}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    disabled={busy}
                    name="identity-source"
                    onChange={() => selectSource(source)}
                    type="radio"
                    value={source.id}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className={`grid size-8 place-items-center rounded-lg ${selected ? "bg-[#aa9dff]/20 text-[#d0caff]" : "bg-white/[.05] text-slate-400"}`}>
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    {selected ? <CheckCircle2 aria-hidden="true" className="size-4 text-[#c5bcff]" /> : null}
                  </div>
                  <span className="mt-4 text-sm font-medium text-white">{source.label}</span>
                  <span className="mt-1 text-xs leading-5 text-slate-500">{source.description}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,.65fr)]">
          <div className="rounded-2xl border border-white/[.08] bg-black/15 p-4 sm:p-5">
            <label className="block" htmlFor="source-label">
              <span className="text-sm font-medium text-slate-100">2. Name this source</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">A clear label keeps every trait traceable to its evidence.</span>
            </label>
            <input
              aria-describedby="source-label-help"
              className="mt-3 h-11 w-full rounded-xl border border-white/[.1] bg-slate-950/75 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#aa9dff]/60 focus:ring-2 focus:ring-[#aa9dff]/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              id="source-label"
              onChange={(event) => setSourceLabel(event.target.value)}
              placeholder="e.g. 2026 portfolio introduction"
              required
              value={sourceLabel}
            />
            <span className="sr-only" id="source-label-help">Give this evidence source an identifiable label.</span>

            <label className="mt-5 block" htmlFor="source-content">
              <span className="text-sm font-medium text-slate-100">3. Paste consented text</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">The current extractor supports text only. It does not make personality claims beyond the evidence.</span>
            </label>
            <textarea
              aria-describedby="source-content-help"
              className="mt-3 min-h-52 w-full resize-y rounded-xl border border-white/[.1] bg-slate-950/75 p-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#aa9dff]/60 focus:ring-2 focus:ring-[#aa9dff]/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              id="source-content"
              onChange={(event) => {
                setContent(event.target.value);
                setSelectedFilename(null);
                setError(null);
                setSuccess(null);
              }}
              placeholder="Paste writing, a resume excerpt, portfolio text, or a personal note you have permission to use…"
              value={content}
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span id="source-content-help">Plain text only. Avoid including information you do not have permission to share.</span>
              <span aria-live="polite" className="font-mono text-[10px] tracking-[.08em] text-slate-600">{content.trim().length.toLocaleString()} CHARACTERS</span>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4 sm:p-5" aria-label="Text import options">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-sky-300/[.08] text-sky-200"><Upload aria-hidden="true" className="size-4" /></span>
              <div>
                <h3 className="text-sm font-medium text-white">Import text instead</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">Use a local .txt or .md file. The text is read here and submitted through the same evidence pipeline.</p>
              </div>
            </div>
            <label
              className={`mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#a99bff]/30 bg-[#8976f2]/[.045] px-4 text-center transition hover:border-[#bcb3ff]/60 hover:bg-[#8976f2]/[.08] focus-within:ring-2 focus-within:ring-[#a99bff]/60 ${busy ? "cursor-not-allowed opacity-60" : ""}`}
              htmlFor="source-file"
            >
              <FileUp aria-hidden="true" className="size-5 text-[#c1b8ff]" />
              <span className="mt-3 text-sm font-medium text-slate-200">Choose .txt or .md</span>
              <span className="mt-1 text-xs text-slate-500">{selectedFilename ?? "No file selected"}</span>
              <input
                accept=".txt,.md,text/plain,text/markdown"
                className="sr-only"
                disabled={busy}
                id="source-file"
                onChange={handleFileChange}
                type="file"
              />
            </label>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/[.06] bg-black/10 p-3 text-xs leading-5 text-slate-500">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
              PDF and DOCX upload, voice samples, and certificate parsing are not available yet. They will remain unavailable until their extractors are ready.
            </p>
          </aside>
        </div>

        {error ? (
          <div aria-live="assertive" className="flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[.07] p-3 text-sm text-rose-100" role="alert">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-200" />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div aria-live="polite" className="flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] p-3 text-sm text-emerald-100" role="status">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-200" />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[.07] pt-5">
          <p className="max-w-xl text-xs leading-5 text-slate-500">
            TrustDNA extracts only deterministic, explainable signals from the evidence you choose.
          </p>
          <Button
            className="h-11 rounded-xl bg-[#8b78f6] px-5 text-white hover:bg-[#9c8aff]"
            disabled={busy || !selectedSource}
            type="submit"
          >
            {busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
            {busy ? "Extracting evidence…" : "Add to Identity Genome"}
          </Button>
        </div>
      </form>

      <div className="mt-8 border-t border-white/[.07] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-[.15em] text-slate-500">EXPANSION ROADMAP</p>
            <h3 className="mt-2 text-base font-medium text-slate-100">Recognized sources, not simulated connections.</h3>
          </div>
          <Badge className="border-[#b9afff]/20 bg-[#8976f2]/[.08] font-mono text-[9px] tracking-[.12em] text-[#c4bbff]" variant="outline">
            COMING SOON
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <PlannedSourceGroup sources={plannedPrimarySources} title="Media & credentials" />
          <PlannedSourceGroup sources={plannedFormatSources} title="Document formats" />
        </div>
        <details className="group mt-3 rounded-2xl border border-white/[.07] bg-black/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium text-slate-200 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a99bff]/60">
            <span>Optional connectors · {connectorSources.length} planned</span>
            <ChevronDown aria-hidden="true" className="size-4 text-slate-500 transition group-open:rotate-180" />
          </summary>
          <div className="border-t border-white/[.07] p-4 pt-3">
            <p className="text-xs leading-5 text-slate-500">Connectors are displayed for transparency only. No OAuth or account connection is initiated from this screen.</p>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Planned source connectors">
              {connectorSources.map((source) => (
                <li key={source.id}>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.08] bg-white/[.02] px-2.5 py-1.5 text-xs text-slate-500">
                    {source.label}
                    <span className="font-mono text-[9px] tracking-[.09em] text-slate-600">COMING SOON</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </section>
  );
}

function PlannedSourceGroup({ sources, title }: { sources: SourceDefinition[]; title: string }) {
  return (
    <section className="rounded-2xl border border-white/[.07] bg-black/10 p-4" aria-label={title}>
      <p className="font-mono text-[9px] tracking-[.13em] text-slate-600">{title.toUpperCase()}</p>
      <ul className="mt-3 space-y-2">
        {sources.map((source) => (
          <li className="flex items-start justify-between gap-3" key={source.id}>
            <div>
              <p className="text-sm text-slate-300">{source.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{source.description}</p>
            </div>
            <span className="shrink-0 rounded-md border border-white/[.08] px-1.5 py-1 font-mono text-[8px] tracking-[.09em] text-slate-600">
              {plannedSourceLabel(source)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
