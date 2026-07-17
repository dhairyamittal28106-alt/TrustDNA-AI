import type { IntelligenceApiPayload, GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { InvestigationResult } from "@/features/judge/types";

export type LiveInvestigationEventType =
  | "evidence_validated"
  | "genome_created"
  | "artifact_processed"
  | "genome_updated"
  | "knowledge_extracted"
  | "genome_merged"
  | "twin_refreshed"
  | "guardian_updated"
  | "case_created"
  | "agents_dispatched"
  | "evidence_correlated"
  | "risk_analyzed"
  | "certificate_generated"
  | "investigation_completed"
  | "error";

export type LiveInvestigationEvent = {
  type: LiveInvestigationEventType;
  data: unknown;
};

export type LiveInvestigationInput = {
  content: string;
  sourceLabel: string;
  displayName: string;
  genomeId?: string;
};

export type GenomeUpdate = IntelligenceApiPayload;

export type InvestigationProgressItem = {
  id: LiveInvestigationEventType;
  title: string;
  detail: string;
  status: "pending" | "active" | "complete" | "error";
};

export type LiveInvestigationOutcome = {
  snapshot: GenomeSnapshot;
  result: InvestigationResult;
};
