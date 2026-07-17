import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export type GuardianState = "idle" | "monitoring" | "learning" | "synchronizing" | "thinking" | "investigating" | "warning";

export type GuardianEventType =
  | "login"
  | "evidence_added"
  | "genome_updated"
  | "gmail_sync"
  | "twin_thinking"
  | "twin_answered"
  | "unknown_question"
  | "investigation_started"
  | "investigation_completed"
  | "certificate_generated"
  | "threat_detected";

export type GuardianEvent = {
  id: string;
  type: GuardianEventType;
  timestamp: string;
  detail?: string;
};

export type GuardianRecommendation = {
  id: string;
  title: string;
  detail: string;
  href: string;
  availability: "available_now" | "planned";
};

export type GuardianOverview = {
  state: GuardianState;
  status: string;
  activity: string;
  genomeVersion: string;
  knowledgeCount: number;
  confidence?: number;
  lastUpdate?: string;
  insights: string[];
  recentKnowledge: IdentityKnowledgeObject[];
  recommendations: GuardianRecommendation[];
};
