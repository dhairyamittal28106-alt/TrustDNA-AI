import { EvidenceSelector } from "@/features/identity-twin/evidence-selector";
import { IdentityReasoningEngine } from "@/features/identity-reasoning/identity-reasoning-engine";
import { GenomeRetriever } from "@/features/identity-twin/genome-retriever";
import { IntentDetector } from "@/features/identity-twin/intent-detector";
import { ReasoningEngine } from "@/features/identity-twin/reasoning-engine";
import { TwinResponseBuilder } from "@/features/identity-twin/response-builder";
import { TwinKnowledgeService } from "@/features/identity-knowledge/twin-knowledge-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinResponse } from "@/features/identity-twin/types";
import type { IdentityReasoningResult, ReasoningEvidence } from "@/features/identity-reasoning/types";

export class IdentityTwinService {
  constructor(
    private readonly intentDetector = new IntentDetector(),
    private readonly genomeRetriever = new GenomeRetriever(),
    private readonly evidenceSelector = new EvidenceSelector(),
    private readonly reasoningEngine = new ReasoningEngine(),
    private readonly identityReasoningEngine = new IdentityReasoningEngine(),
    private readonly responseBuilder = new TwinResponseBuilder(),
    private readonly knowledgeService = new TwinKnowledgeService(),
  ) {}

  answer(question: string, snapshot: GenomeSnapshot): TwinResponse {
    const intent = this.intentDetector.detect(question);
    const knowledgeAnswer = intent === "identity_facts" ? this.knowledgeService.answer(question, snapshot) : null;
    if (knowledgeAnswer) {
      return this.responseBuilder.build(question, "identity_facts", {
        intent: "identity_facts",
        evidence: knowledgeAnswer.evidence,
        sections: snapshot.sections.filter((section) => section.id === "identity-facts"),
        knowledgeObjects: snapshot.knowledgeObjects.filter((object) => knowledgeAnswer.evidence.some((evidence) => evidence.id === object.id)),
        timeline: snapshot.timeline,
        sources: snapshot.sources.filter((source) => source.status === "ingested"),
        version: snapshot.latestVersion?.version,
        genomeConfidence: snapshot.genomeConfidence,
      }, knowledgeAnswer.reasoning);
    }
    if (intent === "identity_reasoning") {
      const identityReasoning = this.identityReasoningEngine.reason(question, snapshot);
      return this.responseBuilder.build(question, intent, reasoningBundle(snapshot, identityReasoning), {
        answer: `${identityReasoning.decision.summary}\n\nRecommendation: ${identityReasoning.decision.recommendation}\n\nAlternative view: ${identityReasoning.decision.alternativeView}`,
        confidence: identityReasoning.confidence,
        reasoningSummary: identityReasoning.reasoningSummary,
        limitations: identityReasoning.limitations,
        suggestedSources: identityReasoning.decision.missingEvidence,
      }, identityReasoning);
    }
    const retrievedGenome = this.genomeRetriever.retrieve(snapshot, intent);
    const evidence = this.evidenceSelector.select(intent, retrievedGenome);
    const reasoning = this.reasoningEngine.reason(intent, evidence);
    return this.responseBuilder.build(question, intent, evidence, reasoning);
  }
}

function reasoningBundle(snapshot: GenomeSnapshot, reasoning: IdentityReasoningResult) {
  const evidence = reasoning.evidence.map(toTwinEvidence);
  const includesCommunication = reasoning.dimensions.some((dimension) => dimension.id === "communication");
  return {
    intent: "identity_reasoning" as const,
    evidence,
    sections: snapshot.sections.filter((section) => section.id === "identity-facts" || includesCommunication && section.id === "communication"),
    knowledgeObjects: snapshot.knowledgeObjects.filter((object) => reasoning.evidence.some((item) => item.id === object.id)),
    timeline: snapshot.timeline,
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function toTwinEvidence(item: ReasoningEvidence) {
  return {
    id: item.id,
    title: item.title,
    detail: `${item.value}. Evidence: ${item.evidence}`,
    category: item.category,
    origin: item.id === "measured-communication" ? "derived" as const : "extracted" as const,
    sources: item.source.split(", ").filter(Boolean),
    updatedAt: item.timestamp === "Unknown" ? undefined : item.timestamp,
  };
}
