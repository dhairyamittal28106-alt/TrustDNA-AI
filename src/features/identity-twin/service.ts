import { EvidenceSelector } from "@/features/identity-twin/evidence-selector";
import { FourLayerResponseComposer } from "@/features/identity-twin/four-layer-response-composer";
import { GenomeRetriever } from "@/features/identity-twin/genome-retriever";
import { HybridIdentityAdvisor } from "@/features/identity-twin/hybrid-identity-advisor";
import { QuestionClassifier, type TwinQuestionRoute } from "@/features/identity-twin/question-classifier";
import { ReasoningEngine } from "@/features/identity-twin/reasoning-engine";
import { TwinResponseBuilder } from "@/features/identity-twin/response-builder";
import { IdentityProfileAggregator } from "@/features/identity-reasoning/identity-profile-aggregator";
import { IdentityReasoningEngine } from "@/features/identity-reasoning/identity-reasoning-engine";
import { TwinKnowledgeService } from "@/features/identity-knowledge/twin-knowledge-service";
import { deduplicateById } from "@/features/identity-knowledge/knowledge-integrity";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { IdentityProfile, IdentityReasoningResult, ReasoningEvidence } from "@/features/identity-reasoning/types";
import type { HybridAdvice, TwinEvidence, TwinEvidenceBundle, TwinIntent, TwinReasoning, TwinResponse } from "@/features/identity-twin/types";

/**
 * Phase 22â€“23 orchestrator. It composes the existing retriever, reasoning
 * engine, advisor, and direct-fact service through one explicit precedence
 * order: Evidence -> Alignment -> General Guidance -> Persona -> Unknowns.
 */
export class IdentityTwinService {
  constructor(
    private readonly classifier = new QuestionClassifier(),
    private readonly genomeRetriever = new GenomeRetriever(),
    private readonly evidenceSelector = new EvidenceSelector(),
    private readonly directReasoning = new ReasoningEngine(),
    private readonly identityReasoning = new IdentityReasoningEngine(),
    private readonly profileAggregator = new IdentityProfileAggregator(),
    private readonly knowledgeService = new TwinKnowledgeService(),
    private readonly hybridAdvisor = new HybridIdentityAdvisor(),
    private readonly composer = new FourLayerResponseComposer(),
    private readonly responseBuilder = new TwinResponseBuilder(),
  ) {}

  answer(question: string, snapshot: GenomeSnapshot): TwinResponse {
    const route = this.classifier.route(question);
    const profile = this.profileAggregator.aggregate(snapshot);

    if (route.questionType === "boundary") {
      return this.finalize(question, route, snapshot, emptyBundle(snapshot, route.intent), profile, boundaryReasoning(route));
    }

    if (route.questionType === "identity_facts") {
      const knowledgeAnswer = this.knowledgeService.answer(question, snapshot);
      const bundle = knowledgeAnswer
        ? directKnowledgeBundle(snapshot, knowledgeAnswer.evidence)
        : directKnowledgeBundle(snapshot, []);
      return this.finalize(question, route, snapshot, bundle, profile, knowledgeAnswer?.reasoning ?? this.knowledgeService.unavailable(question));
    }

    if (route.questionType === "meta") {
      const bundle = this.evidenceSelector.select("identity_summary", this.genomeRetriever.retrieve(snapshot, "identity_summary"));
      return this.finalize(question, route, snapshot, bundle, profile, metaReasoning(snapshot, profile));
    }

    if (route.questionType === "communication" || route.questionType === "observed_knowledge") {
      const bundle = this.evidenceSelector.select(route.intent, this.genomeRetriever.retrieve(snapshot, route.intent));
      return this.finalize(question, route, snapshot, bundle, profile, this.directReasoning.reason(route.intent, bundle));
    }

    if (route.intent === "artifact_comparison") {
      return this.finalize(question, route, snapshot, emptyBundle(snapshot, route.intent), profile, artifactComparisonReasoning());
    }

    const reasoning = this.identityReasoning.reason(question, snapshot);
    const needsGuidance = route.questionType === "decision_support" || route.questionType === "comparison" || route.questionType === "general_guidance";
    const advised = needsGuidance ? this.hybridAdvisor.advise(question, snapshot) : undefined;
    const bundle = combineBundles(
      reasoningBundle(snapshot, reasoning),
      advised ? hybridBundle(snapshot, advised.evidence) : undefined,
    );
    const baseReasoning = reasoningResponse(reasoning, advised);
    return this.finalize(question, route, snapshot, bundle, profile, baseReasoning, reasoning, advised?.advice);
  }

  private finalize(question: string, route: TwinQuestionRoute, snapshot: GenomeSnapshot, bundle: TwinEvidenceBundle, profile: IdentityProfile, reasoning: TwinReasoning, identityReasoning?: IdentityReasoningResult, hybridAdvice?: HybridAdvice) {
    const fourLayerResponse = this.composer.compose({
      question,
      questionType: route.questionType,
      pipeline: route.pipeline,
      evidence: bundle.evidence,
      profile,
      reasoning,
      identityReasoning,
      hybridAdvice,
      boundary: route.questionType === "boundary",
      conflictingEvidence: findConflicts(snapshot, bundle.evidence),
    });
    return this.responseBuilder.build(
      question,
      route.intent,
      bundle,
      { ...reasoning, answer: fourLayerResponse.answer },
      identityReasoning,
      hybridAdvice,
      fourLayerResponse,
    );
  }
}

function directKnowledgeBundle(snapshot: GenomeSnapshot, evidence: TwinEvidence[]): TwinEvidenceBundle {
  return {
    intent: "identity_facts",
    evidence: mergeEvidence("selectedEvidence", evidence),
    sections: snapshot.sections.filter((section) => section.id === "identity-facts"),
    knowledgeObjects: snapshot.knowledgeObjects.filter((object) => evidence.some((item) => item.id === object.id)),
    timeline: snapshot.timeline,
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function emptyBundle(snapshot: GenomeSnapshot, intent: TwinIntent): TwinEvidenceBundle {
  return {
    intent,
    evidence: [],
    sections: [],
    knowledgeObjects: [],
    timeline: [],
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function hybridBundle(snapshot: GenomeSnapshot, evidence: TwinEvidence[]): TwinEvidenceBundle {
  return {
    intent: "hybrid_advice",
    evidence: mergeEvidence("advisorEvidence", evidence),
    sections: snapshot.sections.filter((section) => section.id === "identity-facts" || section.id === "communication"),
    knowledgeObjects: [],
    timeline: snapshot.timeline,
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function reasoningBundle(snapshot: GenomeSnapshot, reasoning: IdentityReasoningResult): TwinEvidenceBundle {
  const auditTrail = mergeEvidence("auditTrail", reasoning.evidence);
  const evidence = mergeEvidence("displayEvidence", auditTrail.map(toTwinEvidence));
  const includesCommunication = reasoning.dimensions.some((dimension) => dimension.id === "communication");
  return {
    intent: "identity_reasoning",
    evidence,
    sections: snapshot.sections.filter((section) => section.id === "identity-facts" || includesCommunication && section.id === "communication"),
    knowledgeObjects: deduplicateById(snapshot.knowledgeObjects.filter((object) => auditTrail.some((item) => item.id === object.id)), "Unified Twin reasoning knowledge objects"),
    timeline: snapshot.timeline,
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function combineBundles(primary: TwinEvidenceBundle, secondary?: TwinEvidenceBundle): TwinEvidenceBundle {
  if (!secondary) return primary;
  return {
    ...primary,
    evidence: mergeEvidence("selectedEvidence", primary.evidence, secondary.evidence),
    sections: deduplicateById([...primary.sections, ...secondary.sections], "Unified Twin response sections"),
    knowledgeObjects: deduplicateById([...primary.knowledgeObjects, ...secondary.knowledgeObjects], "Unified Twin response knowledge objects"),
    timeline: deduplicateById([...primary.timeline, ...secondary.timeline], "Unified Twin response timeline"),
    sources: deduplicateById([...primary.sources, ...secondary.sources], "Unified Twin response sources"),
  };
}

function toTwinEvidence(item: ReasoningEvidence): TwinEvidence {
  return {
    id: item.id,
    title: item.title,
    detail: `${item.value}. Evidence: ${item.evidence}`,
    category: item.category,
    origin: item.id === "measured-communication" ? "derived" : "extracted",
    sources: item.source.split(", ").filter(Boolean),
    updatedAt: item.timestamp === "Unknown" ? undefined : item.timestamp,
  };
}

function reasoningResponse(reasoning: IdentityReasoningResult, advised?: { advice: HybridAdvice; confidence: number | null }): TwinReasoning {
  return {
    answer: `${reasoning.decision.summary}\n\nRecommendation: ${reasoning.decision.recommendation}\n\nAlternative view: ${reasoning.decision.alternativeView}`,
    confidence: reasoning.confidence ?? advised?.confidence ?? null,
    reasoningSummary: [
      ...reasoning.reasoningSummary,
      advised ? "Evidence fusion retained Identity Evidence separately from general decision guidance." : "No general guidance was used outside the selected Identity Evidence pipeline.",
    ],
    limitations: reasoning.limitations,
    suggestedSources: reasoning.decision.missingEvidence,
  };
}

function metaReasoning(snapshot: GenomeSnapshot, profile: IdentityProfile): TwinReasoning {
  const activeFacts = snapshot.knowledgeHistory.filter((fact) => fact.status === "active");
  const missing = ["Additional source diversity", "Recent consented evidence", "Direct statements for any missing Identity dimensions"];
  return {
    answer: `The current Identity Genome contains ${activeFacts.length} active structured fact${activeFacts.length === 1 ? "" : "s"}, ${profile.dimensions.length} explainable profile dimension${profile.dimensions.length === 1 ? "" : "s"}, and ${snapshot.sourceCount} consented source record${snapshot.sourceCount === 1 ? "" : "s"}. This describes coverage, not a claim about unrecorded parts of your identity.`,
    confidence: snapshot.genomeConfidence ?? null,
    reasoningSummary: ["Read active structured Knowledge Objects and measured profile dimensions only.", "Reported Genome coverage and explicit gaps without inferring missing biography or personality."],
    limitations: ["Coverage reflects only consented, currently loaded evidence."],
    suggestedSources: missing,
  };
}

function artifactComparisonReasoning(): TwinReasoning {
  return {
    answer: "I need the actual artifact text and a formal investigation before comparing it to your Identity Genome. I will not declare whether a message, document, or profile is yours from a question alone.",
    confidence: null,
    reasoningSummary: ["Classified this as an artifact comparison.", "Did not retrieve unrelated personal facts or simulate a forensic verdict."],
    limitations: ["An artifact comparison needs the submitted content and relevant metadata."],
    suggestedSources: ["The full artifact text", "Relevant metadata and timestamps", "A selected Identity Genome source for comparison"],
  };
}

function boundaryReasoning(route: TwinQuestionRoute): TwinReasoning {
  const messages = {
    future: "I canâ€™t predict your future or claim certainty about relationships, death, wealth, or other outcomes. TrustDNA can only reason from recorded Identity Evidence.",
    medical: "I canâ€™t diagnose conditions, recommend treatment, or infer medical information from an Identity Genome. For symptoms, medication, or care decisions, consult a qualified clinician.",
    financial: "I canâ€™t provide personalized financial advice or infer your financial situation from an Identity Genome. Use current regulated information and a qualified adviser for material decisions.",
    legal: "I canâ€™t provide legal advice or infer legal circumstances from an Identity Genome. Consult a qualified legal professional for jurisdiction-specific guidance.",
    private: "I donâ€™t have or infer passwords, hidden memories, private messages, relationships, or other unrecorded personal facts.",
  } as const;
  return {
    answer: messages[route.boundaryKind ?? "private"],
    confidence: null,
    reasoningSummary: [`Classified this as a ${route.boundaryKind ?? "private-information"} safety boundary.`, "Did not retrieve unrelated Identity Evidence or create a personal inference."],
    limitations: ["TrustDNA cannot access hidden memories, private facts, or future outcomes."],
    suggestedSources: [],
  };
}

function findConflicts(snapshot: GenomeSnapshot, evidence: TwinEvidence[]) {
  const selectedIds = new Set(evidence.map((item) => item.id));
  const selectedFacts = snapshot.knowledgeHistory.filter((fact) => selectedIds.has(fact.id));
  const byFactKey = new Map<string, string[]>();
  for (const fact of selectedFacts) {
    const values = byFactKey.get(fact.factKey) ?? [];
    values.push(fact.value);
    byFactKey.set(fact.factKey, values);
  }
  return Array.from(byFactKey.entries())
    .filter(([, values]) => new Set(values).size > 1)
    .map(([factKey, values]) => `${factKey.replaceAll("_", " ")} has recorded revisions: ${Array.from(new Set(values)).join(" → ")}`);
}
