import type { IdentityDimension, IdentityReasoningIntent, ReasoningContext, ReasoningEvidence } from "@/features/identity-reasoning/types";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";

const relevance: Record<IdentityReasoningIntent, Partial<Record<IdentityDimension["id"], number>>> = {
  identity_summary: { identity: .55, goals: .8, dreams: .8, career: .75, education: .65, projects: .85, skills: .8, frameworks: .65, interests: .55, values: .7, motivations: .75, strengths: .75, communication: .45, behavior_patterns: .7, learning_style: .55, decision_style: .55, risk_tolerance: .4, ownership_preference: .65 },
  motivation: { goals: 1, dreams: 1, motivations: 1, values: .85, career: .75, interests: .7, projects: .45 },
  strengths: { strengths: 1, projects: .95, skills: .9, frameworks: .75, communication: .7, goals: .45 },
  weaknesses: { goals: .35, career: .35, projects: .35, skills: .35, values: .35 },
  career: { goals: 1, dreams: .9, motivations: .9, values: .75, career: 1, projects: .85, strengths: .8, skills: .8, education: .55, interests: .55, behavior_patterns: .7, learning_style: .5, decision_style: .5, ownership_preference: .7 },
  management: { projects: .8, communication: .8, career: .7, goals: .55, values: .5, strengths: .65, behavior_patterns: .65, decision_style: .7, collaboration_style: .65 },
  entrepreneurship: { projects: 1, goals: 1, dreams: .95, motivations: .95, values: .9, career: .9, strengths: .8, skills: .75, interests: .45, behavior_patterns: .9, ownership_preference: .9, risk_tolerance: .55, decision_style: .5 },
  higher_studies: { education: 1, goals: .9, dreams: .85, motivations: .85, career: .85, skills: .6, values: .55 },
  relocation: { goals: .6, dreams: .55, career: .5, education: .4, values: .45 },
  startup_fit: { projects: 1, goals: 1, dreams: .95, motivations: .95, values: .85, career: .9, strengths: .8, skills: .75, communication: .45, behavior_patterns: .8, ownership_preference: .85, risk_tolerance: .5 },
  goal_alignment: { goals: 1, dreams: .9, motivations: .85, values: .8, career: .8, projects: .65, interests: .55, behavior_patterns: .65, ownership_preference: .65 },
  evidence_support: { identity: .6, goals: .8, dreams: .8, career: .8, education: .75, projects: .8, skills: .8, frameworks: .7, interests: .75, values: .8, motivations: .8, strengths: .75, communication: .6 },
  general_decision: { goals: .8, dreams: .75, motivations: .8, values: .75, career: .7, projects: .65, strengths: .65, interests: .6, education: .45 },
};

export class EvidenceWeightEngine {
  select(context: ReasoningContext): ReasoningEvidence[] {
    const weights = relevance[context.intent];
    const selected = context.profile.dimensions
      .map((dimension) => this.toEvidence(dimension, weights[dimension.id] ?? 0))
      .filter((evidence): evidence is ReasoningEvidence => evidence !== null);

    for (const pattern of context.profile.behaviorSignals) {
      const matching = selected.filter((item) => pattern.evidenceIds.some((id) => item.evidenceIds.includes(id)));
      matching.forEach((item) => { item.weight = Math.max(item.weight, Math.min(1, item.weight + .05)); });
    }
    return mergeEvidence("reasoningEvidence", selected)
      .sort((left, right) => right.weight - left.weight || right.confidence - left.confidence);
  }

  private toEvidence(dimension: IdentityDimension, relevanceWeight: number): ReasoningEvidence | null {
    if (relevanceWeight <= 0) return null;
    return {
      id: dimension.evidenceIds[0] ?? `dimension-${dimension.id}`,
      title: dimension.label,
      value: dimension.value,
      category: dimension.id,
      source: dimension.source,
      evidence: dimension.evidence,
      version: dimension.version,
      timestamp: dimension.timestamp,
      confidence: dimension.confidence,
      weight: Number((dimension.confidence * relevanceWeight).toFixed(3)),
      evidenceIds: dimension.evidenceIds,
    };
  }
}
