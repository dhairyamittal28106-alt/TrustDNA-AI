import { BehaviorPatternEngine } from "@/features/identity-reasoning/behavior-pattern-engine";
import { EvidenceWeightEngine } from "@/features/identity-reasoning/evidence-weight-engine";
import { IdentityConfidenceEngine } from "@/features/identity-reasoning/identity-confidence-engine";
import { IdentityDecisionEngine } from "@/features/identity-reasoning/identity-decision-engine";
import { IdentityProfileAggregator } from "@/features/identity-reasoning/identity-profile-aggregator";
import { ReasoningExplanationService } from "@/features/identity-reasoning/reasoning-explanation-service";
import { ReasoningGraphBuilder } from "@/features/identity-reasoning/reasoning-graph-builder";
import { RecommendationEngine } from "@/features/identity-reasoning/recommendation-engine";
import type { IdentityReasoningIntent, IdentityReasoningResult } from "@/features/identity-reasoning/types";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";

/** The deterministic, explainable Identity Twin reasoning pipeline. */
export class IdentityReasoningEngine {
  constructor(
    private readonly profileAggregator = new IdentityProfileAggregator(),
    private readonly behaviorPatterns = new BehaviorPatternEngine(),
    private readonly evidenceWeights = new EvidenceWeightEngine(),
    private readonly decisionEngine = new IdentityDecisionEngine(),
    private readonly recommendations = new RecommendationEngine(),
    private readonly confidenceEngine = new IdentityConfidenceEngine(),
    private readonly graphBuilder = new ReasoningGraphBuilder(),
    private readonly explanations = new ReasoningExplanationService(),
  ) {}

  reason(question: string, snapshot: GenomeSnapshot): IdentityReasoningResult {
    const intent = classifyIdentityReasoningIntent(question);
    const allDimensions = this.profileAggregator.aggregate(snapshot);
    const patterns = this.behaviorPatterns.extract(allDimensions);
    const evidence = this.evidenceWeights.select(intent, allDimensions, patterns);
    const dimensions = allDimensions.filter((dimension) => evidence.some((item) => item.category === dimension.id));
    const visiblePatterns = patterns.filter((pattern) => pattern.evidenceIds.some((id) => evidence.some((item) => item.id === id)));
    const decision = this.recommendations.build(this.decisionEngine.decide({ intent, dimensions, evidence }));
    const graph = this.graphBuilder.build(question, dimensions, visiblePatterns, evidence, decision);

    return {
      intent,
      genomeVersion: snapshot.latestVersion?.version,
      dimensions,
      behaviorPatterns: visiblePatterns,
      evidence,
      graph,
      decision,
      confidence: this.confidenceEngine.estimate(evidence),
      reasoningSummary: this.explanations.summarize(intent, evidence, decision, snapshot.latestVersion?.version),
      limitations: this.explanations.limitations(evidence, decision),
    };
  }
}

export function classifyIdentityReasoningIntent(question: string): IdentityReasoningIntent {
  const normalized = question.toLocaleLowerCase();
  if (/\b(summarize|summary|about me|identity profile)\b/.test(normalized)) return "identity_summary";
  if (/\b(motivate|motivation|drives? me)\b/.test(normalized)) return "motivation";
  if (/\b(strength|strengths)\b/.test(normalized)) return "strengths";
  if (/\b(weakness|weaknesses|improve)\b/.test(normalized)) return "weaknesses";
  if (/\b(entrepreneur|founder|business owner)\b/.test(normalized)) return "entrepreneurship";
  if (/\b(management|manager|manage a team|leadership)\b/.test(normalized)) return "management";
  if (/\b(higher studies|postgraduate|master'?s|masters|graduate school|further studies)\b/.test(normalized)) return "higher_studies";
  if (/\b(move abroad|relocate|relocation|another country|foreign country)\b/.test(normalized)) return "relocation";
  if (/\b(startup|start-up)\b/.test(normalized)) return "startup_fit";
  if (/\b(align|alignment)\b/.test(normalized) && /\b(goal|decision|choice|career)\b/.test(normalized)) return "goal_alignment";
  if (/\b(evidence|supporting evidence|why do you recommend|why recommend)\b/.test(normalized)) return "evidence_support";
  if (/\b(career suits?|career fit|career path|what career)\b/.test(normalized)) return "career";
  return "general_decision";
}
