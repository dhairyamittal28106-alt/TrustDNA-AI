import type { VoiceEvidence } from "@/features/investigation/types";

export type TranscriptState = {
  available: boolean;
  message: string;
  transcript?: string;
};

/**
 * A clear capability boundary: media is captured locally, but this deployment
 * has no speech-to-text provider configured. It never manufactures a transcript.
 */
export class TranscriptService {
  status(voice: VoiceEvidence | undefined, suppliedTranscript: string): TranscriptState {
    if (!voice) return { available: false, message: "Record or upload voice evidence to add a transcript." };
    if (suppliedTranscript.trim()) return { available: true, transcript: suppliedTranscript.trim(), message: "A user-provided transcript is ready for the text investigation pipeline." };
    return { available: false, message: "Speech-to-text is not configured for this deployment. Add a verified transcript to investigate this audio through the current evidence pipeline." };
  }
}
