import type {
  GenomeSection,
  GenomeSnapshot,
  GenomeTimelineEvent,
  KnowledgeObject,
  KnowledgeOrigin,
  SourceRecord,
} from "@/features/identity-intelligence/types";
import type { IdentityReasoningResult } from "@/features/identity-reasoning/types";

export type TwinIntent =
  | "identity_facts"
  | "communication"
  | "observed_knowledge"
  | "artifact_comparison"
  | "evidence_requirements"
  | "identity_summary"
  | "identity_reasoning"
  | "hybrid_advice"
  | "prediction_boundary"
  | "unknown";

/** Semantic question categories used by the Unified Cognitive Orchestrator. */
export type TwinQuestionType =
  | "identity_facts"
  | "identity_summary"
  | "decision_support"
  | "explanation"
  | "meta"
  | "comparison"
  | "boundary"
  | "communication"
  | "observed_knowledge"
  | "general_guidance";

export type TwinPipelineName =
  | "direct_knowledge"
  | "profile_aggregation"
  | "identity_reasoning"
  | "evidence_explanation"
  | "genome_meta"
  | "evidence_comparison"
  | "safety_boundary"
  | "evidence_informed_guidance"
  | "communication_analysis"
  | "observed_knowledge";

export type TwinResponseLayer = {
  id: "identity_evidence" | "identity_alignment" | "general_guidance" | "persona_simulation";
  label: string;
  content: string;
  evidenceIds: string[];
};

/** Visible, non-chain-of-thought trace returned with every orchestrated answer. */
export type TwinReasoningTrace = {
  questionType: TwinQuestionType;
  pipeline: TwinPipelineName;
  evidenceSources: string[];
  evidenceCount: number;
  dimensionsUsed: string[];
  missingEvidence: string[];
  confidenceDrivers: string[];
  ignoredEvidence: string[];
};

export type TwinGuardianState = "listening" | "thinking" | "reasoning" | "answer_ready";

export type TwinPipelineStageId =
  | "question"
  | "intent"
  | "genome"
  | "evidence"
  | "knowledge"
  | "reasoning"
  | "decision"
  | "confidence"
  | "answer";

export type TwinPipelineStatus = "pending" | "active" | "complete";

export type TwinPipelineStage = {
  id: TwinPipelineStageId;
  label: string;
  detail: string;
  status: TwinPipelineStatus;
};

export type TwinEvidence = {
  id: string;
  title: string;
  detail: string;
  category: string;
  origin: KnowledgeOrigin;
  sources: string[];
  updatedAt?: string;
};

export type TwinRetrievedGenome = {
  snapshot: GenomeSnapshot;
  sections: GenomeSection[];
  knowledgeObjects: KnowledgeObject[];
  timeline: GenomeTimelineEvent[];
  sources: SourceRecord[];
  version?: string;
  confidence?: number;
};

export type TwinEvidenceBundle = {
  intent: TwinIntent;
  evidence: TwinEvidence[];
  sections: GenomeSection[];
  knowledgeObjects: KnowledgeObject[];
  timeline: GenomeTimelineEvent[];
  sources: SourceRecord[];
  version?: string;
  genomeConfidence?: number;
};

export type TwinReasoning = {
  answer: string;
  confidence: number | null;
  reasoningSummary: string[];
  limitations: string[];
  suggestedSources: string[];
};

export type HybridAdvice = {
  topic: string;
  identityContext: {
    summary: string;
    evidence: Array<{ label: string; value: string }>;
  };
  generalGuidance: {
    summary: string;
    actions: string[];
  };
  alignment: {
    summary: string;
    considerations: string[];
  };
  evidenceBoundary: {
    identityEvidence: string[];
    generalKnowledge: string;
    unknown: string[];
  };
};

export type TwinResponse = TwinReasoning & {
  id: string;
  question: string;
  intent: TwinIntent;
  confidenceLabel: string;
  evidenceUsed: TwinEvidence[];
  evidenceBundle: TwinEvidenceBundle;
  /** Structured, visible reasoning for open-ended decision-support questions. */
  identityReasoning?: IdentityReasoningResult;
  /** Deterministic advice with explicit evidence and general-knowledge boundaries. */
  hybridAdvice?: HybridAdvice;
  /** The four evidence-precedence layers, safe to render without hidden reasoning. */
  responseLayers?: TwinResponseLayer[];
  /** Explainable orchestration metadata for audit and trace views. */
  reasoningTrace?: TwinReasoningTrace;
  pipeline: TwinPipelineStage[];
  generatedAt: string;
};

export type TwinConversationMessage =
  | { id: string; role: "twin"; content: string; response?: TwinResponse }
  | { id: string; role: "user"; content: string };
