import type { VoiceEvidence } from "@/features/investigation/types";

const supportedAudioExtensions = /\.(wav|mp3|m4a)$/i;
const supportedAudioMimeTypes = new Set(["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/x-m4a"]);

export class VoiceUploadService {
  accepts(file: File): boolean {
    return supportedAudioExtensions.test(file.name) || supportedAudioMimeTypes.has(file.type);
  }

  async createUpload(file: File): Promise<VoiceEvidence> {
    if (!this.accepts(file)) throw new Error("Choose a WAV, MP3, or M4A audio file.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Choose an audio file smaller than 20 MB.");
    const playbackUrl = URL.createObjectURL(file);
    return {
      id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "upload",
      file,
      name: file.name,
      mimeType: file.type || "audio/unknown",
      size: file.size,
      durationSeconds: await durationFor(playbackUrl),
      playbackUrl,
    };
  }

  async createRecording(blob: Blob): Promise<VoiceEvidence> {
    const extension = blob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `trustdna-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`, { type: blob.type || "audio/webm" });
    const playbackUrl = URL.createObjectURL(file);
    return {
      id: `recording-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "recording",
      file,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      durationSeconds: await durationFor(playbackUrl),
      playbackUrl,
    };
  }

  release(evidence: VoiceEvidence | undefined): void {
    if (evidence?.playbackUrl) URL.revokeObjectURL(evidence.playbackUrl);
  }
}

function durationFor(source: string): Promise<number | undefined> {
  if (typeof Audio === "undefined") return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const audio = new Audio();
    const timeout = window.setTimeout(() => resolve(undefined), 5_000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
      audio.src = "";
    };
    audio.onerror = () => {
      window.clearTimeout(timeout);
      resolve(undefined);
    };
    audio.src = source;
  });
}
