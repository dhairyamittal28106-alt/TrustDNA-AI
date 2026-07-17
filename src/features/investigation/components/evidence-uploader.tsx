"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Check, FileAudio, FileCode2, FileImage, FileText, ImageIcon, Mic, RotateCcw, Trash2, Upload, Volume2 } from "lucide-react";
import { EvidenceKind, type EvidenceDraft, type VoiceEvidence } from "@/features/investigation/types";
import { VoiceRecorder } from "@/features/investigation/components/voice-recorder";
import { VoiceUploadService } from "@/features/investigation/voice-upload-service";

const voiceUploadService = new VoiceUploadService();

const evidenceOptions: Array<{ id: EvidenceKind; title: string; detail: string; icon: typeof FileText }> = [
  { id: "text", title: "Text / Markdown", detail: "TXT and Markdown are analyzed today.", icon: FileCode2 },
  { id: "email", title: "Email evidence", detail: "Import a readable .eml artifact.", icon: FileText },
  { id: "image", title: "Image evidence", detail: "Upload is available; image extraction is pending.", icon: ImageIcon },
  { id: "voice", title: "Voice evidence", detail: "Record or upload audio; transcript analysis is explicit.", icon: Mic },
];

export function EvidenceUploader({ disabled, onChange, onVoiceReceived }: { disabled?: boolean; onChange: (draft: EvidenceDraft) => void; onVoiceReceived: (detail: string) => void }) {
  const [kind, setKind] = useState<EvidenceKind>("text");
  const [sourceLabel, setSourceLabel] = useState("Consented text evidence");
  const [text, setText] = useState("");
  const [image, setImage] = useState<EvidenceDraft["image"]>();
  const [voice, setVoice] = useState<VoiceEvidence>();
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string>();
  const voiceRef = useRef<VoiceEvidence | undefined>(undefined);

  useEffect(() => {
    onChange({ kind, sourceLabel, text, image, voice });
  }, [image, kind, onChange, sourceLabel, text, voice]);

  useEffect(() => () => {
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    voiceUploadService.release(voiceRef.current);
  }, [image?.previewUrl]);

  function selectKind(next: EvidenceKind) {
    if (next !== "voice" && voiceRef.current) {
      voiceUploadService.release(voiceRef.current);
      voiceRef.current = undefined;
      setVoice(undefined);
    }
    if (next !== "image" && image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
      setImage(undefined);
    }
    setKind(next);
    setFileName(undefined);
    setError(undefined);
    setSourceLabel(defaultLabel(next));
  }

  async function chooseTextFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError(undefined);
    if (!/\.(txt|md|eml)$/i.test(file.name) && !file.type.startsWith("text/") && file.type !== "message/rfc822") {
      setError("Choose a TXT, Markdown, or .eml file. PDF and DOCX extractors are coming soon.");
      return;
    }
    if (file.size > 120_000) {
      setError("Choose a text artifact smaller than 120 KB for the active backend pipeline.");
      return;
    }
    try {
      const content = await file.text();
      if (!content.trim()) throw new Error();
      setText(content);
      setFileName(file.name);
      setSourceLabel(file.name.replace(/\.[^.]+$/, "") || defaultLabel(kind));
    } catch {
      setError("The selected artifact does not contain readable text. Paste its text instead.");
    }
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError(undefined);
    if (!file.type.startsWith("image/")) {
      setError("Choose a standard image file. Image extraction is not yet available in this backend.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setImage({ name: file.name, size: file.size, previewUrl });
    setFileName(file.name);
    setSourceLabel(file.name.replace(/\.[^.]+$/, "") || "Image evidence");
  }

  async function chooseAudio(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setError(undefined);
    try {
      const nextVoice = await voiceUploadService.createUpload(file);
      replaceVoice(nextVoice);
      setSourceLabel(file.name.replace(/\.[^.]+$/, "") || "Voice evidence");
      setFileName(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not prepare that audio file.");
    }
  }

  function replaceVoice(nextVoice: VoiceEvidence) {
    voiceUploadService.release(voiceRef.current);
    voiceRef.current = nextVoice;
    setVoice(nextVoice);
    setFileName(nextVoice.name);
    onVoiceReceived("Recording received. Speech-to-text is unavailable until a verified transcript is provided.");
  }

  function removeVoice() {
    voiceUploadService.release(voiceRef.current);
    voiceRef.current = undefined;
    setVoice(undefined);
    setFileName(undefined);
  }

  const transcriptRequired = kind === "voice" && Boolean(voice) && !text.trim();

  return <section aria-labelledby="evidence-uploader-title" className="glass rounded-3xl border border-white/[.1] bg-[#080b22]/70 p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[10px] tracking-[.16em] text-[#b9afff]">EVIDENCE INTAKE</p><h2 id="evidence-uploader-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">Bring your own evidence.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Choose the artifact you are authorized to investigate. The workspace clearly separates active text analysis from extractors that are not yet available.</p></div><span className="rounded-xl border border-cyan-200/15 bg-cyan-300/[.06] px-3 py-2 text-xs text-cyan-100">Consent-led intake</span></div>
    <fieldset className="mt-7" disabled={disabled}><legend className="text-sm font-medium text-slate-100">1. Select evidence type</legend><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{evidenceOptions.map((option) => { const Icon = option.icon; const selected = kind === option.id; return <button key={option.id} type="button" onClick={() => selectKind(option.id)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b7abff] ${selected ? "border-[#b1a5ff]/55 bg-[#8b78f6]/[.12]" : "border-white/[.08] bg-black/10 hover:border-[#b1a5ff]/30"}`}><span className={`grid size-9 place-items-center rounded-xl ${selected ? "bg-[#b7abff]/20 text-[#d6cfff]" : "bg-white/[.05] text-slate-500"}`}><Icon aria-hidden="true" className="size-4" /></span><p className="mt-4 text-sm font-medium text-white">{option.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{option.detail}</p>{selected && <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono tracking-[.1em] text-[#cfc8ff]"><Check aria-hidden="true" className="size-3" />SELECTED</span>}</button>; })}</div></fieldset>
    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,.62fr)]"><div><label className="block"><span className="text-sm font-medium text-slate-100">2. Evidence label</span><input disabled={disabled} value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} maxLength={120} className="mt-2 h-11 w-full rounded-xl border border-white/[.1] bg-black/20 px-3 text-sm text-slate-100 outline-none focus:border-[#b6aaff]/60" /></label>{(kind === "text" || kind === "email") && <TextEvidence text={text} onTextChange={setText} disabled={disabled} email={kind === "email"} />}{kind === "voice" && <VoiceEvidenceInput voice={voice} text={text} disabled={disabled} onTextChange={setText} onUpload={chooseAudio} onRemove={removeVoice} />}{kind === "image" && <ImageEvidence image={image} disabled={disabled} onUpload={chooseImage} />}</div><aside className="rounded-2xl border border-white/[.08] bg-black/15 p-4 sm:p-5"><p className="font-mono text-[10px] tracking-[.14em] text-slate-500">LOCAL FILE IMPORT</p>{(kind === "text" || kind === "email") ? <label className="mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#b1a5ff]/30 bg-[#8b78f6]/[.05] p-5 text-center transition hover:border-[#c3baff]/55"><Upload aria-hidden="true" className="size-5 text-[#c7beff]" /><span className="mt-3 text-sm font-medium text-slate-200">Import TXT, Markdown, or .eml</span><span className="mt-1 text-xs text-slate-500">{fileName ?? "No file selected"}</span><input className="sr-only" disabled={disabled} type="file" accept=".txt,.md,.eml,text/plain,text/markdown,message/rfc822" onChange={chooseTextFile} /></label> : kind === "voice" ? <div className="mt-4"><VoiceRecorder disabled={disabled} onVoiceReady={replaceVoice} /><label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#b1a5ff]/30 px-4 py-3 text-sm text-[#c9c1ff] transition hover:bg-[#8b78f6]/[.07]"><FileAudio aria-hidden="true" className="size-4" />Upload WAV, MP3, or M4A<input className="sr-only" disabled={disabled} type="file" accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4" onChange={chooseAudio} /></label></div> : <p className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] p-4 text-xs leading-5 text-amber-100">Image upload is real and retained only in this browser view. The current backend has no image extractor, so it cannot be investigated yet.</p>}<div className="mt-4 rounded-xl border border-dashed border-white/[.1] bg-white/[.02] p-3"><p className="font-mono text-[9px] tracking-[.12em] text-slate-600">EXTRACTOR COMING SOON</p><p className="mt-2 text-xs leading-5 text-slate-500">PDF, DOCX, video, and certificate extraction remain unavailable until dedicated backend adapters are implemented.</p></div></aside></div>
    {transcriptRequired && <p role="status" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[.06] p-3 text-xs leading-5 text-amber-100">Speech-to-text is not configured. Add a verified transcript before this voice artifact can enter the text investigation pipeline.</p>}{error && <p role="alert" className="mt-4 rounded-xl border border-red-200/15 bg-red-300/[.07] p-3 text-xs leading-5 text-red-100">{error}</p>}
  </section>;
}

function TextEvidence({ disabled, email, onTextChange, text }: { disabled?: boolean; email: boolean; onTextChange: (value: string) => void; text: string }) {
  return <label className="mt-5 block"><span className="text-sm font-medium text-slate-100">3. {email ? "Email artifact" : "Consented text"}</span><textarea disabled={disabled} value={text} onChange={(event) => onTextChange(event.target.value)} maxLength={120_000} placeholder={email ? "Paste the complete email text or import a readable .eml artifact…" : "Paste consented writing, resume text, portfolio text, or personal notes…"} className="mt-2 min-h-64 w-full resize-y rounded-xl border border-white/[.1] bg-black/20 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#b6aaff]/60" /><span className="mt-2 block text-right font-mono text-[10px] text-slate-600">{text.length.toLocaleString()} / 120,000 CHARACTERS</span></label>;
}

function VoiceEvidenceInput({ disabled, onRemove, onTextChange, onUpload, text, voice }: { disabled?: boolean; onRemove: () => void; onTextChange: (value: string) => void; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; text: string; voice?: VoiceEvidence }) {
  return <div className="mt-5">{voice ? <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[.045] p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-100"><Volume2 aria-hidden="true" className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-100">{voice.name}</p><p className="mt-1 text-xs text-slate-500">{voice.source === "recording" ? "Browser recording" : "Uploaded audio"} · {formatBytes(voice.size)} · {voice.durationSeconds === undefined ? "Duration unavailable" : formatDuration(voice.durationSeconds)}</p></div></div><div className="flex gap-1"><button type="button" onClick={onRemove} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[.06] hover:text-white" aria-label="Delete voice evidence"><Trash2 aria-hidden="true" className="size-3.5" /></button><label className="grid size-8 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-white/[.06] hover:text-white"><RotateCcw aria-hidden="true" className="size-3.5" /><span className="sr-only">Replace voice evidence</span><input className="sr-only" disabled={disabled} type="file" accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4" onChange={onUpload} /></label></div></div><audio controls className="mt-4 w-full" src={voice.playbackUrl}>Your browser cannot play this audio file.</audio></div> : <p className="rounded-xl border border-dashed border-white/[.1] p-4 text-xs leading-5 text-slate-500">Record with the microphone or upload WAV, MP3, or M4A audio.</p>}<label className="mt-5 block"><span className="text-sm font-medium text-slate-100">Verified transcript</span><span className="mt-1 block text-xs leading-5 text-slate-500">Provide a transcript you are authorized to use. TrustDNA will not generate or guess one.</span><textarea disabled={disabled || !voice} value={text} onChange={(event) => onTextChange(event.target.value)} maxLength={120_000} placeholder={voice ? "Paste a verified transcript to enable the current text investigation pipeline…" : "Record or upload voice evidence first."} className="mt-2 min-h-44 w-full resize-y rounded-xl border border-white/[.1] bg-black/20 p-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#b6aaff]/60 disabled:opacity-55" /></label></div>;
}

function ImageEvidence({ disabled, image, onUpload }: { disabled?: boolean; image?: EvidenceDraft["image"]; onUpload: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return <div className="mt-5">{image ? <div className="overflow-hidden rounded-2xl border border-white/[.08] bg-black/20"><div className="h-48 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(5,8,26,.2), rgba(5,8,26,.55)), url("${image.previewUrl}")` }} /><div className="p-4"><p className="text-sm text-slate-200">{image.name}</p><p className="mt-1 text-xs text-slate-500">{formatBytes(image.size)} · Extractor coming soon</p></div></div> : <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[.12] bg-black/15 p-5 text-center"><FileImage aria-hidden="true" className="size-6 text-slate-500" /><span className="mt-3 text-sm text-slate-300">Choose image evidence</span><span className="mt-1 text-xs text-slate-500">The file will preview locally; no image analysis is claimed.</span><input className="sr-only" disabled={disabled} type="file" accept="image/*" onChange={onUpload} /></label>}</div>;
}

function defaultLabel(kind: EvidenceKind): string {
  return kind === "email" ? "Email evidence" : kind === "voice" ? "Voice evidence" : kind === "image" ? "Image evidence" : "Consented text evidence";
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${Math.round(seconds % 60).toString().padStart(2, "0")}`;
}
