import type { IdentityDecision } from "@/features/identity-reasoning/types";

/** Keeps the user-facing recommendation shape uniform across every decision context. */
export class RecommendationEngine {
  build(decision: IdentityDecision): IdentityDecision {
    return {
      ...decision,
      recommendation: decision.recommendation.trim(),
      alternativeView: decision.alternativeView.trim(),
      missingEvidence: Array.from(new Set(decision.missingEvidence)),
    };
  }
}
