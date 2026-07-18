import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export type IdentityReasoningIntent =
  | "identity_summary"
  | "motivation"
  | "strengths"
  | "weaknesses"
  | "career"
  | "management"
  | "entrepreneurship"
  | "higher_studies"
  | "relocation"
  | "startup_fit"
  | "goal_alignment"
  | "evidence_support"
  | "general_decision";

export type IdentityDimensionId =
  | "goals"
  | "career"
  | "education"
  | "projects"
  | "skills"
  | "interests"
  | "sports"
  | "communication";

export type ReasoningEvidence = {
  id: string;
  title: string;
  value: string;
  category: string;
  source: string;
  evidence: string;
  version: string;
  timestamp: string;
  confidence: number;
  weight: number;
  fact?: IdentityKnowledgeObject;
};

export type IdentityDimension = {
  id: IdentityDimensionId;
  label: string;
  value: string;
  confidence: number;
  source: string;
  evidence: string;
  version: string;
  timestamp: string;
  evidenceIds: string[];
};

export type BehaviorPattern = {
  id: string;
  label: string;
  detail: string;
  confidence: number;
  evidenceIds: string[];
};

export type ReasoningGraphNode = {
  id: string;
  label: string;
  kind: "question" | "dimension" | "behavior" | "evidence" | "decision";
};

export type ReasoningGraphEdge = {
  from: string;
  to: string;
  relationship: "uses" | "supports" | "informs";
};

export type ReasoningGraph = {
  nodes: ReasoningGraphNode[];
  edges: ReasoningGraphEdge[];
};

export type IdentityDecision = {
  label: string;
  summary: string;
  recommendation: string;
  alternativeView: string;
  missingEvidence: string[];
};

export type IdentityReasoningResult = {
  intent: IdentityReasoningIntent;
  genomeVersion?: string;
  dimensions: IdentityDimension[];
  behaviorPatterns: BehaviorPattern[];
  evidence: ReasoningEvidence[];
  graph: ReasoningGraph;
  decision: IdentityDecision;
  confidence: number | null;
  reasoningSummary: string[];
  limitations: string[];
};
