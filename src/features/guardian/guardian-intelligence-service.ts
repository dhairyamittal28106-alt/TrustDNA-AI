import { GuardianInsightGenerator } from "@/features/guardian/guardian-insight-generator";
import { GuardianKnowledgeAdapter } from "@/features/guardian/guardian-knowledge-adapter";
import { GuardianRecommendationEngine } from "@/features/guardian/guardian-recommendation-engine";
import { GuardianStateMachine } from "@/features/guardian/guardian-state-machine";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GuardianEvent, GuardianOverview } from "@/features/guardian/types";

export class GuardianIntelligenceService {
  constructor(
    private readonly stateMachine = new GuardianStateMachine(),
    private readonly adapter = new GuardianKnowledgeAdapter(),
    private readonly insightGenerator = new GuardianInsightGenerator(),
    private readonly recommendationEngine = new GuardianRecommendationEngine(),
  ) {}

  build(snapshot: GenomeSnapshot, event?: GuardianEvent): GuardianOverview {
    const state = event ? this.stateMachine.transition(event) : "monitoring";
    const activity = event?.detail ?? this.defaultActivity(snapshot);
    return {
      ...this.adapter.overview(snapshot, state, activity),
      insights: this.insightGenerator.generate(snapshot, event),
      recommendations: this.recommendationEngine.recommend(snapshot),
    };
  }

  private defaultActivity(snapshot: GenomeSnapshot): string {
    return snapshot.identityFacts.length ? "Identity Twin is available with the latest structured knowledge." : "Waiting for direct identity evidence.";
  }
}
