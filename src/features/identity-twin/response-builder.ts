import type { HybridAdvice, TwinEvidenceBundle, TwinIntent, TwinPipelineStage, TwinResponse } from "@/features/identity-twin/types";
import type { TwinReasoning } from "@/features/identity-twin/types";
import type { IdentityReasoningResult } from "@/features/identity-reasoning/types";
import { deduplicateById } from "@/features/identity-knowledge/knowledge-integrity";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";

const pipelineLabels: Array<Pick<TwinPipelineStage, "id" | "label">> = [
  { id: "question", label: "Question received" },
  { id: "intent", label: "Intent detected" },
  { id: "genome", label: "Genome retrieved" },
  { id: "evidence", label: "Evidence selected" },
  { id: "knowledge", label: "Knowledge objects correlated" },
  { id: "reasoning", label: "Reasoning Graph constructed" },
  { id: "decision", label: "Decision Engine bounded" },
  { id: "confidence", label: "Evidence confidence estimated" },
  { id: "answer", label: "Answer prepared" },
];

export class TwinResponseBuilder {
  build(question: string, intent: TwinIntent, bundle: TwinEvidenceBundle, reasoning: TwinReasoning, identityReasoning?: IdentityReasoningResult, hybridAdvice?: HybridAdvice): TwinResponse {
    const deduplicatedBundle: TwinEvidenceBundle = {
      ...bundle,
      evidence: mergeEvidence("displayEvidence", bundle.evidence),
      sections: deduplicateById(bundle.sections, "Twin response sections"),
      knowledgeObjects: deduplicateById(bundle.knowledgeObjects, "Twin response knowledge objects"),
      timeline: deduplicateById(bundle.timeline, "Twin response timeline"),
      sources: deduplicateById(bundle.sources, "Twin response sources"),
    };
    const evidenceCount = deduplicatedBundle.evidence.length;
    const pipeline = pipelineLabels.map((stage) => ({
      ...stage,
      status: "complete" as const,
      detail: this.detailFor(stage.id, intent, evidenceCount, deduplicatedBundle.version),
    }));

    const auditTrail = identityReasoning
      ? { ...identityReasoning, evidence: mergeEvidence("auditTrail", identityReasoning.evidence) }
      : undefined;

    return {
      id: `twin-${Date.now()}`,
      question,
      intent,
      answer: reasoning.answer,
      confidence: reasoning.confidence,
      confidenceLabel: reasoning.confidence === null ? "Unknown" : `${reasoning.confidence}%`,
      evidenceUsed: deduplicatedBundle.evidence,
      evidenceBundle: deduplicatedBundle,
      reasoningSummary: reasoning.reasoningSummary,
      limitations: reasoning.limitations,
      suggestedSources: reasoning.suggestedSources,
      identityReasoning: auditTrail,
      hybridAdvice,
      pipeline,
      generatedAt: new Date().toISOString(),
    };
  }

  private detailFor(stage: TwinPipelineStage["id"], intent: TwinIntent, evidenceCount: number, version?: string): string {
    switch (stage) {
      case "question": return "User question is kept local to this evidence-bound response.";
      case "intent": return `Mapped to ${intent.replaceAll("_", " ")}.`;
      case "genome": return version ? `Using Identity Genome ${version}.` : "No versioned Genome is available yet.";
      case "evidence": return evidenceCount ? `${evidenceCount} explainable evidence item${evidenceCount === 1 ? "" : "s"} selected.` : "No relevant evidence selected.";
      case "knowledge": return evidenceCount ? "Only source-linked knowledge objects were retained." : "No knowledge objects support this conclusion.";
      case "reasoning": return intent === "identity_reasoning" ? "Connected selected dimensions, evidence, and deterministic behavior signals." : intent === "hybrid_advice" ? "Kept Identity Evidence separate from deterministic general guidance." : "No external model or ungrounded personal inference was used.";
      case "decision": return intent === "identity_reasoning" ? "Applied deterministic rules with a recommendation, alternative view, and evidence gaps." : intent === "hybrid_advice" ? "Prepared an alignment checklist without making a personal prediction." : "No decision engine applies to this evidence scope.";
      case "confidence": return intent === "identity_reasoning" ? "Calculated from evidence relevance, confidence, coverage, and category diversity." : intent === "hybrid_advice" ? "Measures the coverage of Identity Evidence, not the correctness of life advice." : "Confidence remains inside the available evidence boundary.";
      case "answer": return evidenceCount ? "Response includes evidence, confidence, and limitations." : "Response clearly marks the gap as unknown.";
    }
  }
}
