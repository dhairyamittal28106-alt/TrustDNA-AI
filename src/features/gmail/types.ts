import type { IntelligenceApiPayload } from "@/features/identity-intelligence/types";

export type GmailConnectionHealth = "healthy" | "needs_reauthorization" | "unavailable" | "error";

export type GmailConnectionRecord = {
  email: string;
  connectedAt: string;
  lastSyncAt?: string;
  messagesAnalyzed: number;
  genomeId?: string;
  genomeVersion?: string;
  health: GmailConnectionHealth;
};

export type GmailAuthorization = {
  accessToken: string;
  email: string;
};

export type GmailSyncSummary = {
  messagesAnalyzed: number;
  charactersAnalyzed: number;
  frequentPhrases: string[];
  sourceLabel: string;
  syncedAt: string;
};

export type GmailSyncResult = IntelligenceApiPayload & {
  summary: GmailSyncSummary;
};
