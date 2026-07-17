"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Radio, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { VoiceUploadService } from "@/features/investigation/voice-upload-service";
import type { VoiceEvidence } from "@/features/investigation/types";

const voiceUploadService = new VoiceUploadService();

export function VoiceRecorder({ disabled, onVoiceReady }: { disabled?: boolean; onVoiceReady: (voice: VoiceEvidence) => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const interval = window.setInterval(() => setSeconds((value) => value + 1), 1_000);
    return () => window.clearInterval(interval);
  }, [recording]);

  useEffect(() => () => {
    if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void audioContextRef.current?.close();
  }, []);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser does not support microphone recording. Upload a WAV, MP3, or M4A file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setSeconds(0);
      setLevel(0);

      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = context;
      analyserRef.current = analyser;
      readLevel();

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
        setRecording(false);
        setLevel(0);
        void audioContextRef.current?.close();
        audioContextRef.current = null;
        if (!blob.size) return;
        void voiceUploadService.createRecording(blob).then(onVoiceReady).catch((cause) => setError(cause instanceof Error ? cause.message : "We could not prepare that recording."));
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access was not granted. Allow access and try again, or upload an audio file.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function readLevel() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const values = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(values);
    const average = values.reduce((sum, value) => sum + Math.abs(value - 128), 0) / values.length;
    setLevel(Math.min(100, Math.round(average * 4)));
    animationFrameRef.current = window.requestAnimationFrame(readLevel);
  }

  return <section aria-label="Record voice evidence" className="rounded-2xl border border-white/[.08] bg-black/15 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-100">Record voice evidence</p><p className="mt-1 text-xs leading-5 text-slate-500">Browser recording stays local until you choose how to proceed.</p></div><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[.1em] ${recording ? "border-red-200/20 bg-red-400/10 text-red-100" : "border-white/[.1] text-slate-500"}`}>{recording ? <Radio aria-hidden="true" className="size-3 animate-pulse" /> : <Mic aria-hidden="true" className="size-3" />}{recording ? "RECORDING" : "READY"}</span></div>
    <div className="mt-5 flex items-center gap-4"><Button type="button" disabled={disabled} onClick={recording ? stopRecording : startRecording} className={`h-11 rounded-xl ${recording ? "bg-red-500/80 text-white hover:bg-red-500" : "bg-[#8b78f6] text-white hover:bg-[#9c8aff]"}`}>{recording ? <MicOff aria-hidden="true" className="size-4" /> : <Mic aria-hidden="true" className="size-4" />}{recording ? "Stop recording" : "Start recording"}</Button><p className="font-mono text-sm text-slate-300">{formatDuration(seconds)}</p></div>
    <div className="mt-5"><div className="flex items-center justify-between text-[10px] font-mono tracking-[.1em] text-slate-600"><span>INPUT LEVEL</span><span>{recording ? `${level}%` : "IDLE"}</span></div><Progress value={level} className="mt-2 h-1.5 bg-white/[.08] [&>div]:bg-gradient-to-r [&>div]:from-[#967dff] [&>div]:to-cyan-300" /></div>
    {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[.06] p-3 text-xs leading-5 text-amber-100"><TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{error}</p>}
  </section>;
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
