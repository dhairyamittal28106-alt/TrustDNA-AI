import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { EvolutionRecommendation } from "@/features/identity-evolution/types";

export class RecommendationEngine {
  recommend(snapshot: GenomeSnapshot): EvolutionRecommendation[] {
    const recommendations: EvolutionRecommendation[] = [];
    if (snapshot.sourceCount < 3) {
      recommendations.push({ id: "communication-coverage", title: "Broaden communication coverage", detail: "A small set of analyzed text sources can only describe the current/latest writing snapshot. Add consented writing from another context to make that evidence more representative.", suggestedSources: ["Writing samples", "Email exports when supported", "Blogs or portfolio introductions"], status: "available_now" });
    }
    recommendations.push({ id: "decision-evidence", title: "Plan for decision-profile evidence", detail: "TrustDNA will not infer leadership or decision patterns from writing alone. These source types remain future capabilities until dedicated extractors are available.", suggestedSources: ["Project reports", "Meeting notes", "Team feedback"], status: "future_supported" });
    recommendations.push({ id: "verified-knowledge", title: "Separate observed terms from verified experience", detail: "Observed domain terms are not skills or qualifications. Add verifiable project, credential, or work-history evidence when those source types are supported.", suggestedSources: ["Portfolio projects", "Verified credentials", "Resume or work history"], status: "future_supported" });
    return recommendations;
  }
}
