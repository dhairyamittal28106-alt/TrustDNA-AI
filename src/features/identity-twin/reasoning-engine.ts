import type { TwinEvidenceBundle, TwinIntent, TwinReasoning } from "@/features/identity-twin/types";

const insufficientEvidence = (message: string, suggestedSources: string[]): TwinReasoning => ({
  answer: message,
  confidence: null,
  reasoningSummary: ["The requested conclusion is not represented in the current evidence-backed Identity Genome.", "TrustDNA keeps unsupported claims visible as unknown instead of inferring them."],
  limitations: ["No directly relevant, explainable evidence is available for this question."],
  suggestedSources,
});

function confidenceFor(bundle: TwinEvidenceBundle): number | null {
  if (!bundle.evidence.length || bundle.genomeConfidence === undefined) return null;
  const evidenceCoverage = Math.min(bundle.evidence.length / 4, 1);
  return Math.round(bundle.genomeConfidence * (0.65 + evidenceCoverage * 0.35));
}

function observedEvidenceList(bundle: TwinEvidenceBundle): string {
  return bundle.evidence.slice(0, 4).map((evidence) => evidence.title.toLowerCase()).join(", ");
}

export class ReasoningEngine {
  reason(intent: TwinIntent, bundle: TwinEvidenceBundle): TwinReasoning {
    const hasEvidence = bundle.evidence.length > 0;

    if (intent === "evidence_requirements") {
      return insufficientEvidence(
        "I can’t make a reliable claim about career direction, goals, preferences, decisions, or personal strengths from the current text-only Identity Genome. Those traits need direct, consented evidence rather than inference.",
        ["Resume or verified work history", "Portfolio or project records", "User-provided goals or preferences", "Consented calendar or timeline evidence"],
      );
    }

    if (intent === "artifact_comparison") {
      return insufficientEvidence(
        "I need the actual artifact text and a formal investigation to compare it against this Identity Genome. I won’t declare whether a message is yours from a question alone.",
        ["The full email or message text", "Relevant metadata and timestamps", "A selected identity source for comparison"],
      );
    }

    if (!hasEvidence) {
      return insufficientEvidence(
        "There isn’t enough explainable Identity Genome evidence yet to answer that. Add a consented writing sample first, then I can describe only the patterns the system has measured.",
        ["A consented writing sample", "A verified email export", "A portfolio or resume through a supported connector"],
      );
    }

    const observed = observedEvidenceList(bundle);
    const confidence = confidenceFor(bundle);

    if (intent === "communication") {
      return {
        answer: `Based on the current analyzed text, your communication profile is described through measured signals such as ${observed}. This is an evidence-backed writing snapshot, not a claim about how you communicate in every context.`,
        confidence,
        reasoningSummary: ["Retrieved only communication, writing, and professional sections from the current Identity Genome snapshot.", "Used deterministic text features; source labels represent coverage rather than per-trait attribution.", "Excluded behavior, values, and other unsupported personal traits."],
        limitations: ["Current coverage is limited to consented, analyzed text sources.", "The Genome does not yet establish behavior across channels or audiences."],
        suggestedSources: ["Additional writing samples from distinct contexts", "A consented email source when available"],
      };
    }

    if (intent === "observed_knowledge") {
      return {
        answer: `The current Genome has observed these vocabulary and domain signals: ${observed}. They reflect terms measured in analyzed text; they are not verified skills, qualifications, interests, or professional claims.`,
        confidence,
        reasoningSummary: ["Retrieved only observed vocabulary and domain-term evidence.", "Returned source-linked terms without upgrading them into verified expertise.", "No career, credential, or capability inference was made."],
        limitations: ["Observed terms can indicate language used in text, not demonstrated ability.", "Verified skills require a supported portfolio, credential, or work-history source."],
        suggestedSources: ["Portfolio or project evidence", "Verified credential records", "A resume through a supported document source"],
      };
    }

    if (intent === "identity_summary") {
      return {
        answer: `Your current Identity Genome is a text-evidence profile with ${bundle.sources.length || "available"} analyzed-source coverage record${bundle.sources.length === 1 ? "" : "s"}. Its current/latest text feature snapshot covers measurable communication, writing, vocabulary, and professional-tone signals: ${observed}. It deliberately does not infer missing personal traits.`,
        confidence,
        reasoningSummary: ["Combined explainable sections available in the current text-evidence model.", "Kept evidence categories distinct from unsupported traits.", "Preserved the Identity Genome version as the response boundary."],
        limitations: ["This is not a complete representation of a person.", "Timeline, values, and behavioral evidence remain unavailable until supported sources are added."],
        suggestedSources: ["More consented writing samples", "A supported resume or portfolio source", "Future connector-backed timeline evidence"],
      };
    }

    return insufficientEvidence(
      "I can currently answer evidence-backed questions about the writing, communication, and observed vocabulary in your Identity Genome. I don’t have enough grounded evidence for that question yet.",
      ["A consented writing sample", "A relevant artifact for a formal investigation", "A supported portfolio, resume, or connector source"],
    );
  }
}
