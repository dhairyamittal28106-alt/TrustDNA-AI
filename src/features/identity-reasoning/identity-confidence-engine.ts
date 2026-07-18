import type { ReasoningEvidence } from "@/features/identity-reasoning/types";

/** Estimates confidence from evidence quality and coverage, never from a language-model probability. */
export class IdentityConfidenceEngine {
  estimate(evidence: ReasoningEvidence[]): number | null {
    if (!evidence.length) return null;
    const totalWeight = evidence.reduce((total, item) => total + item.weight, 0);
    if (totalWeight <= 0) return null;

    const weightedConfidence = evidence.reduce((total, item) => total + item.confidence * item.weight, 0) / totalWeight;
    const coverage = Math.min(evidence.length / 4, 1);
    const diversity = Math.min(new Set(evidence.map((item) => item.category)).size / 3, 1);
    return Math.round(Math.min(.95, weightedConfidence * .65 + coverage * .2 + diversity * .15) * 100);
  }
}
