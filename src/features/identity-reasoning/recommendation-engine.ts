import type { IdentityDecision } from "@/features/identity-reasoning/types";

 
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
