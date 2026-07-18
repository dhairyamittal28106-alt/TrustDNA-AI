import type { IdentityDecision, IdentityProfile, IdentityReasoningIntent, ReasoningEvidence } from "@/features/identity-reasoning/types";

const intentLabels: Record<IdentityReasoningIntent, string> = {
  identity_summary: "an evidence-backed profile summary",
  motivation: "motivation evidence",
  strengths: "evidence-backed strengths",
  weaknesses: "a weakness evidence boundary",
  career: "career direction",
  management: "management fit",
  entrepreneurship: "entrepreneurship fit",
  higher_studies: "higher-studies decision support",
  relocation: "relocation decision support",
  startup_fit: "startup-fit decision support",
  goal_alignment: "goal alignment",
  evidence_support: "recommendation evidence",
  general_decision: "a general decision",
};

/** Delivers an auditable summary of the structured pipeline without exposing hidden chain-of-thought. */
export class ReasoningExplanationService {
  summarize(intent: IdentityReasoningIntent, evidence: ReasoningEvidence[], decision: IdentityDecision, profile: IdentityProfile): string[] {
    const categories = Array.from(new Set(evidence.map((item) => item.title))).join(", ");
    return [
      `Mapped the question to ${intentLabels[intent]}.`,
      `Synthesized an Identity Profile with ${profile.dimensions.length} evidence-backed dimensions from ${profile.sourceCount} source${profile.sourceCount === 1 ? "" : "s"}.`,
      evidence.length ? `Used ${evidence.length} directly stored or measured evidence dimension${evidence.length === 1 ? "" : "s"}: ${categories}.` : "No directly relevant evidence dimension was available.",
      profile.genomeVersion ? `Kept the conclusion inside Identity Genome ${profile.genomeVersion}.` : "No versioned Genome was available, so the response remains evidence-limited.",
      "Excluded unrecorded personality, risk, financial, and relationship claims.",
      `Decision boundary: ${decision.label}.`,
    ];
  }

  limitations(evidence: ReasoningEvidence[], decision: IdentityDecision): string[] {
    const boundary = evidence.length
      ? "Confidence represents the quality and relevance of available evidence, not certainty about a future outcome."
      : "No directly relevant structured evidence supports a personalized conclusion.";
    return [boundary, ...decision.missingEvidence.map((item) => `Missing evidence: ${item}.`)];
  }
}
