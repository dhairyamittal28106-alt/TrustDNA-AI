import { PersonaConsistencyEngine } from "@/features/identity-twin/persona-consistency-engine";
import type { IdentityDimension, IdentityProfile, IdentityReasoningResult } from "@/features/identity-reasoning/types";
import type { HybridAdvice, TwinEvidence, TwinPipelineName, TwinQuestionType, TwinReasoning, TwinReasoningTrace, TwinResponseLayer } from "@/features/identity-twin/types";

type ComposeInput = {
  questionType: TwinQuestionType;
  pipeline: TwinPipelineName;
  evidence: TwinEvidence[];
  profile: IdentityProfile;
  reasoning: TwinReasoning;
  identityReasoning?: IdentityReasoningResult;
  hybridAdvice?: HybridAdvice;
  boundary?: boolean;
  conflictingEvidence?: string[];
};

export type FourLayerResponse = {
  answer: string;
  layers: TwinResponseLayer[];
  trace: TwinReasoningTrace;
};

/** Enforces evidence > alignment > general guidance > persona precedence. */
export class FourLayerResponseComposer {
  constructor(private readonly persona = new PersonaConsistencyEngine()) {}

  compose(input: ComposeInput): FourLayerResponse {
    const dimensions = input.identityReasoning?.dimensions ?? relevantProfileDimensions(input.profile, input.evidence);
    const layers: TwinResponseLayer[] = [];

    if (input.evidence.length) {
      layers.push({
        id: "identity_evidence",
        label: "Identity Evidence",
        content: identityEvidenceContent(input.evidence, input.reasoning.answer, input.questionType, input.conflictingEvidence ?? []),
        evidenceIds: input.evidence.map((item) => item.id),
      });
    }

    if (!input.boundary && dimensions.length && input.questionType !== "identity_facts") {
      layers.push({
        id: "identity_alignment",
        label: "Identity Alignment",
        content: alignmentFor(input, dimensions),
        evidenceIds: dimensions.flatMap((dimension) => dimension.evidenceIds),
      });
    }

    const generalGuidance = guidanceFor(input);
    if (generalGuidance) {
      layers.push({ id: "general_guidance", label: "General Guidance", content: generalGuidance, evidenceIds: [] });
    }

    const persona = !input.boundary && shouldSimulatePersona(input.questionType)
      ? this.persona.simulate(input.profile, dimensions)
      : null;
    if (persona) {
      layers.push({ id: "persona_simulation", label: "Persona Simulation", content: persona.content, evidenceIds: dimensions.flatMap((dimension) => dimension.evidenceIds) });
    }

    const missingEvidence = unique([
      ...input.reasoning.suggestedSources,
      ...input.reasoning.limitations,
      ...(input.identityReasoning?.decision.missingEvidence ?? []),
      ...(input.hybridAdvice?.evidenceBoundary.unknown ?? []),
    ]);
    const trace: TwinReasoningTrace = {
      questionType: input.questionType,
      pipeline: input.pipeline,
      evidenceSources: unique(input.evidence.flatMap((item) => item.sources)),
      evidenceCount: input.evidence.length,
      dimensionsUsed: dimensions.map((dimension) => dimension.label),
      missingEvidence,
      confidenceDrivers: confidenceDrivers(input.evidence, dimensions, input.profile, persona?.confidence, input.conflictingEvidence ?? []),
      ignoredEvidence: ignoredDimensions(input.profile, dimensions),
    };
    return {
      answer: renderLayers(layers, missingEvidence, input.reasoning.answer, input.questionType === "explanation" ? trace : undefined),
      layers,
      trace,
    };
  }
}

function identityEvidenceContent(evidence: TwinEvidence[], answer: string, questionType: TwinQuestionType, conflicts: string[]) {
  if (questionType === "identity_facts") return answer;
  const conflictNote = conflicts.length ? ` Recorded revisions: ${conflicts.join("; ")}` : "";
  const observed = `Recorded evidence considered: ${evidence.slice(0, 4).map((item) => `${item.title}: ${item.detail}`).join("; ")}.${conflictNote}`;
  return ["identity_summary", "meta", "explanation"].includes(questionType) ? `${answer}\n\n${observed}` : observed;
}

function alignmentFor(input: ComposeInput, dimensions: IdentityDimension[]) {
  const decision = input.identityReasoning?.decision;
  if (decision) {
    const advisorBoundary = input.hybridAdvice?.alignment.summary ? ` ${input.hybridAdvice.alignment.summary}` : "";
    return `${decision.summary} Deterministic recommendation: ${decision.recommendation}.${advisorBoundary}`;
  }
  if (input.hybridAdvice) return input.hybridAdvice.alignment.summary;
  return `Recorded ${dimensions.map((dimension) => dimension.label.toLocaleLowerCase()).join(", ")} provide the relevant comparison points. They inform reflection only and do not determine an outcome.`;
}

function guidanceFor(input: ComposeInput): string | null {
  if (input.hybridAdvice) {
    return `${input.hybridAdvice.generalGuidance.summary} Practical next steps: ${input.hybridAdvice.generalGuidance.actions.join("; ")}`;
  }
  if (input.boundary) return input.reasoning.answer;
  if (["decision_support", "comparison", "general_guidance"].includes(input.questionType)) {
    return "Separate verified facts, assumptions, and unknowns; compare the practical constraints and test the smallest reversible next step before making a material decision.";
  }
  return null;
}

function shouldSimulatePersona(questionType: TwinQuestionType) {
  return ["decision_support", "comparison", "general_guidance"].includes(questionType);
}

function confidenceDrivers(evidence: TwinEvidence[], dimensions: IdentityDimension[], profile: IdentityProfile, personaConfidence?: number, conflicts: string[] = []) {
  const categories = new Set(evidence.map((item) => item.category));
  const latestUpdate = evidence.map((item) => item.updatedAt).filter((value): value is string => Boolean(value)).sort().at(-1);
  const drivers = [
    `Relevance: ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} matched the selected pipeline.`,
    `Diversity: ${categories.size} evidence ${categories.size === 1 ? "category" : "categories"} contributed.`,
    `Coverage: ${dimensions.length} Identity Profile dimension${dimensions.length === 1 ? "" : "s"} was used.`,
    `Sources: ${profile.sourceCount} consented source record${profile.sourceCount === 1 ? "" : "s"} are available.`,
    latestUpdate ? `Freshness: latest selected evidence is timestamped ${latestUpdate}.` : "Freshness: selected evidence has no timestamped update available.",
    conflicts.length ? `Consistency: ${conflicts.length} recorded revision${conflicts.length === 1 ? "" : "s"} is surfaced rather than silently resolved.` : "Consistency: no conflicting selected fact revision was detected.",
  ];
  if (personaConfidence !== undefined) drivers.push(`Persona simulation confidence is capped by ${personaConfidence}% supporting dimension confidence.`);
  return drivers;
}

function ignoredDimensions(profile: IdentityProfile, used: IdentityDimension[]) {
  const usedIds = new Set(used.map((dimension) => dimension.id));
  return profile.dimensions.filter((dimension) => !usedIds.has(dimension.id)).map((dimension) => dimension.label);
}

function relevantProfileDimensions(profile: IdentityProfile, evidence: TwinEvidence[]) {
  const categories = new Set(evidence.map((item) => item.category));
  return profile.dimensions.filter((dimension) => categories.has(dimension.id) || evidence.some((item) => item.id === `profile-${dimension.id}`));
}

function renderLayers(layers: TwinResponseLayer[], unknowns: string[], fallback: string, trace?: TwinReasoningTrace) {
  const rendered = layers.map((layer) => `${layer.label}\n${layer.content}`);
  if (unknowns.length) rendered.push(`Explicit Unknowns\n${unknowns.join("; ")}`);
  if (trace) rendered.push(`Visible Trace\nQuestion Type: ${trace.questionType.replaceAll("_", " ")}; Pipeline: ${trace.pipeline.replaceAll("_", " ")}; Selected evidence: ${trace.evidenceCount}; Ignored dimensions: ${trace.ignoredEvidence.join(", ") || "None"}; Confidence drivers: ${trace.confidenceDrivers.join(" ")}`);
  return rendered.length ? rendered.join("\n\n") : fallback;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
