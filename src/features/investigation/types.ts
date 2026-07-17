import type { InvestigationResult } from "@/features/judge/types";

export type InvestigationType =
  | "identity_verification"
  | "resume_verification"
  | "email_investigation"
  | "voice_transcript"
  | "document_investigation"
  | "custom";

export type EvidenceKind = "text" | "email" | "image" | "voice";

export type VoiceEvidence = {
  id: string;
  source: "recording" | "upload";
  file: File;
  name: string;
  mimeType: string;
  size: number;
  durationSeconds?: number;
  playbackUrl: string;
};

export type EvidenceDraft = {
  kind: EvidenceKind;
  sourceLabel: string;
  text: string;
  image?: { name: string; size: number; previewUrl: string };
  voice?: VoiceEvidence;
};

export type InvestigationHistoryRecord = {
  id: string;
  createdAt: string;
  investigationType: InvestigationType;
  evidenceLabel: string;
  evidenceKind: EvidenceKind;
  result: InvestigationResult;
};
