import { PersonaConsistencyEngine } from "@/features/identity-twin/persona-consistency-engine";
import type { IdentityDimension, IdentityProfile, IdentityReasoningResult } from "@/features/identity-reasoning/types";
import type { HybridAdvice, TwinEvidence, TwinPipelineName, TwinQuestionType, TwinReasoning, TwinReasoningTrace, TwinResponseLayer } from "@/features/identity-twin/types";

type ComposeInput = {
  question: string;
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

/**
 * Converts the orchestrator's deterministic result into a concise, human
 * response. Evidence and audit metadata remain structured; only their
 * presentation is synthesized here.
 */
export class FourLayerResponseComposer {
  constructor(private readonly persona = new PersonaConsistencyEngine()) {}

  compose(input: ComposeInput): FourLayerResponse {
    const dimensions = input.identityReasoning?.dimensions ?? relevantProfileDimensions(input.profile, input.evidence);
    const themes = themesFor(dimensions, input.evidence);
    const missingEvidence = unique([
      ...input.reasoning.suggestedSources,
      ...input.reasoning.limitations,
      ...(input.identityReasoning?.decision.missingEvidence ?? []),
      ...(input.hybridAdvice?.evidenceBoundary.unknown ?? []),
    ]);
    const layers: TwinResponseLayer[] = [];

    const evidenceContent = identityEvidenceFor(input, themes);
    if (evidenceContent) {
      layers.push({
        id: "identity_evidence",
        label: "Identity Evidence",
        content: evidenceContent,
        evidenceIds: input.evidence.map((item) => item.id),
      });
    }

    const why = whyFor(input, themes);
    if (!input.boundary && why) {
      layers.push({
        id: "identity_alignment",
        label: "Identity Alignment",
        content: why,
        evidenceIds: dimensions.flatMap((dimension) => dimension.evidenceIds),
      });
    }

    const generalGuidance = guidanceFor(input);
    if (generalGuidance) {
      layers.push({ id: "general_guidance", label: "General Guidance", content: generalGuidance, evidenceIds: [] });
    }

    const persona = !input.boundary && shouldSimulatePersona(input.questionType)
      ? this.persona.simulate(input.profile, dimensions, input.question)
      : null;
    if (persona) {
      layers.push({
        id: "persona_simulation",
        label: "Persona Simulation",
        content: persona.content,
        evidenceIds: dimensions.flatMap((dimension) => dimension.evidenceIds),
      });
    }

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
      answer: renderSynthesis({
        answer: blufFor(input, themes),
        why,
        identityEvidence: evidenceContent,
        generalGuidance,
        persona: persona?.content,
        unknowns: missingEvidence,
      }),
      layers,
      trace,
    };
  }
}

function blufFor(input: ComposeInput, themes: string[]) {
  if (input.boundary || input.questionType === "identity_facts") return firstSentence(input.reasoning.answer);
  if (input.identityReasoning?.decision.recommendation) return firstSentence(input.identityReasoning.decision.recommendation);
  if (input.questionType === "identity_summary" && themes.length) return `Your current Identity Genome points to ${humanList(themes, 3)}.`;
  return firstSentence(input.reasoning.answer);
}

function whyFor(input: ComposeInput, themes: string[]) {
  if (input.boundary) return "This is a safety boundary: the Identity Genome is not a basis for predicting private, medical, legal, financial, or future outcomes.";
  if (input.questionType === "identity_facts") {
    return input.evidence.length
      ? "This answer comes from a direct, versioned Identity Genome record rather than an inference."
      : "There is no direct, consented Identity Genome record that can answer this safely.";
  }
  if (themes.length) {
    const decisionContext = input.identityReasoning?.decision.summary;
    return `${decisionContext ? firstSentence(decisionContext) + " " : ""}The relevant evidence forms a consistent pattern around ${humanList(themes, 3)}.`;
  }
  if (input.evidence.length) return "The conclusion is bounded to the selected consented evidence and does not infer unrecorded traits or history.";
  return "No directly relevant Identity Evidence was available, so no personal conclusion has been added.";
}

function identityEvidenceFor(input: ComposeInput, themes: string[]) {
  if (!input.evidence.length) return null;
  if (input.questionType === "identity_facts") {
    const sources = unique(input.evidence.flatMap((item) => item.sources));
    return `The answer is supported by a direct consented record${sources.length ? ` from ${humanList(sources, 2)}` : ""}.`;
  }

  const revision = input.conflictingEvidence?.length
    ? ` Its recorded history includes ${humanList(input.conflictingEvidence, 2)}, which is retained rather than hidden.`
    : "";
  if (themes.length) return `The current Genome shows ${humanList(themes, 3)}.${revision}`;

  const sources = unique(input.evidence.flatMap((item) => item.sources));
  return `This synthesis uses ${input.evidence.length} consented evidence record${input.evidence.length === 1 ? "" : "s"}${sources.length ? ` from ${humanList(sources, 2)}` : ""}.${revision}`;
}

function guidanceFor(input: ComposeInput): string | null {
  if (input.boundary) return null;
  const advice = input.hybridAdvice;
  if (!advice || advice.topic === "Personal decision") return null;

  const action = advice.generalGuidance.actions[0];
  return action
    ? `For ${advice.topic.toLocaleLowerCase()}, ${lowercaseFirst(advice.generalGuidance.summary)} The immediate practical move is to ${lowercaseFirst(action)}`
    : `For ${advice.topic.toLocaleLowerCase()}, ${lowercaseFirst(advice.generalGuidance.summary)}`;
}

function shouldSimulatePersona(questionType: TwinQuestionType) {
  return ["decision_support", "comparison", "general_guidance"].includes(questionType);
}

function themesFor(dimensions: IdentityDimension[], evidence: TwinEvidence[]) {
  const themes = dimensions.map(themeForDimension).filter((theme): theme is string => Boolean(theme));
  if (themes.length) return unique(themes).slice(0, 4);
  return unique(evidence.slice(0, 3).map((item) => evidenceTheme(item))).filter(Boolean);
}

function themeForDimension(dimension: IdentityDimension) {
  const value = cleanValue(dimension.value);
  if (!value) return null;
  const themes: Partial<Record<IdentityDimension["id"], string>> = {
    goals: `a stated direction toward ${value}`,
    dreams: `a long-term ambition to ${value}`,
    career: `a career direction centered on ${value}`,
    projects: `a record of building ${value}`,
    skills: `hands-on technical capability in ${value}`,
    frameworks: `practical experience with ${value}`,
    education: `an educational foundation in ${value}`,
    values: `a preference for ${value}`,
    motivations: `motivation rooted in ${value}`,
    interests: `sustained interest in ${value}`,
    behavior_patterns: `a demonstrated pattern of ${value}`,
    communication: `a communication pattern characterized by ${value}`,
    ownership_preference: `a preference for ${value}`,
    learning_style: `a learning approach shaped by ${value}`,
  };
  return themes[dimension.id] ?? `recorded context around ${value}`;
}

function evidenceTheme(evidence: TwinEvidence) {
  const detail = cleanValue(evidence.detail.replace(/\s*Evidence:\s*.*/i, ""));
  return detail ? `recorded evidence that ${lowercaseFirst(detail)}` : "";
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

function renderSynthesis(input: {
  answer: string;
  why: string;
  identityEvidence: string | null;
  generalGuidance: string | null;
  persona?: string;
  unknowns: string[];
}) {
  const sections = [firstSentence(input.answer), `Why: ${input.why}`];
  if (input.identityEvidence) sections.push(`Identity evidence: ${input.identityEvidence}`);
  if (input.generalGuidance) sections.push(`General guidance: ${input.generalGuidance}`);
  if (input.persona) sections.push(`Persona simulation: ${input.persona}`);
  if (input.unknowns.length) sections.push(`Unknowns: ${humanList(input.unknowns, 4)}.`);
  return sections.join("\n\n");
}

function firstSentence(value: string) {
  const normalized = cleanValue(value).replace(/^(?:Answer|Recommendation):\s*/i, "");
  const sentence = normalized.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalized;
  return ensureSentence(sentence);
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").replace(/[;,:]+$/, "").trim();
}

function lowercaseFirst(value: string) {
  const normalized = cleanValue(value);
  return normalized ? normalized[0].toLocaleLowerCase() + normalized.slice(1) : normalized;
}

function ensureSentence(value: string) {
  const normalized = cleanValue(value);
  return normalized && !/[.!?]$/.test(normalized) ? `${normalized}.` : normalized;
}

function humanList(values: string[], max: number) {
  const items = unique(values.map(cleanValue)).slice(0, max);
  if (items.length < 2) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
