import type { BehaviorPattern, IdentityDimension, IdentityReasoningIntent, ReasoningEvidence } from "@/features/identity-reasoning/types";

const relevance: Record<IdentityReasoningIntent, Partial<Record<IdentityDimension["id"], number>>> = {
  identity_summary: { goals: .75, career: .7, education: .65, projects: .8, skills: .75, interests: .55, sports: .35, communication: .45 },
  motivation: { goals: 1, career: .75, interests: .7, projects: .45 },
  strengths: { projects: 1, skills: .9, communication: .7, goals: .45 },
  weaknesses: { goals: .4, career: .4, projects: .4, skills: .4 },
  career: { goals: 1, career: 1, projects: .85, skills: .8, education: .55, interests: .55 },
  management: { projects: .8, communication: .8, career: .7, goals: .55 },
  entrepreneurship: { projects: 1, goals: 1, career: .9, skills: .75, interests: .45 },
  higher_studies: { education: 1, goals: .9, career: .85, skills: .6 },
  relocation: { goals: .6, career: .5, education: .4 },
  startup_fit: { projects: 1, goals: 1, career: .9, skills: .75, communication: .45 },
  goal_alignment: { goals: 1, career: .8, projects: .65, interests: .55 },
  evidence_support: { goals: .75, career: .75, education: .75, projects: .75, skills: .75, interests: .75, sports: .45, communication: .6 },
  general_decision: { goals: .8, career: .7, projects: .65, interests: .6, education: .45 },
};

export class EvidenceWeightEngine {
  select(intent: IdentityReasoningIntent, dimensions: IdentityDimension[], patterns: BehaviorPattern[]): ReasoningEvidence[] {
    const weights = relevance[intent];
    const selected = dimensions
      .map((dimension) => this.toEvidence(dimension, weights[dimension.id] ?? 0))
      .filter((evidence): evidence is ReasoningEvidence => evidence !== null);

    for (const pattern of patterns) {
      const matching = selected.filter((item) => pattern.evidenceIds.some((id) => item.id === id || item.id === "measured-communication" && id === "measured-communication"));
      matching.forEach((item) => { item.weight = Math.max(item.weight, Math.min(1, item.weight + .05)); });
    }
    return selected.sort((left, right) => right.weight - left.weight || right.confidence - left.confidence);
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
    };
  }
}
