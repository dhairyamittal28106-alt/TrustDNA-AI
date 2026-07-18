import { EvidenceSelector } from "@/features/identity-twin/evidence-selector";
import { HybridIdentityAdvisor } from "@/features/identity-twin/hybrid-identity-advisor";
import { IdentityReasoningEngine } from "@/features/identity-reasoning/identity-reasoning-engine";
import { GenomeRetriever } from "@/features/identity-twin/genome-retriever";
import { IntentDetector } from "@/features/identity-twin/intent-detector";
import { ReasoningEngine } from "@/features/identity-twin/reasoning-engine";
import { TwinResponseBuilder } from "@/features/identity-twin/response-builder";
import { TwinKnowledgeService } from "@/features/identity-knowledge/twin-knowledge-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinEvidence, TwinResponse } from "@/features/identity-twin/types";
import type { IdentityReasoningResult, ReasoningEvidence } from "@/features/identity-reasoning/types";

/** Routes every Twin question through a deterministic, evidence-bounded path. */
export class IdentityTwinService {
  constructor(
    private readonly intentDetector = new IntentDetector(),
    private readonly genomeRetriever = new GenomeRetriever(),
    private readonly evidenceSelector = new EvidenceSelector(),
    private readonly reasoningEngine = new ReasoningEngine(),
    private readonly identityReasoningEngine = new IdentityReasoningEngine(),
    private readonly responseBuilder = new TwinResponseBuilder(),
    private readonly knowledgeService = new TwinKnowledgeService(),
    private readonly hybridAdvisor = new HybridIdentityAdvisor(),
  ) {}

  answer(question: string, snapshot: GenomeSnapshot): TwinResponse {
    const intent = this.intentDetector.detect(question);

    if (intent === "prediction_boundary") {
      return this.responseBuilder.build(question, intent, emptyBundle(snapshot, intent), predictionBoundary(question));
    }

    if (intent === "hybrid_advice") {
      const hybrid = this.hybridAdvisor.advise(question, snapshot);
      return this.responseBuilder.build(question, intent, hybridBundle(snapshot, hybrid.evidence), {
        answer: "I prepared an evidence-bounded advisory response. The cards below keep your Identity Evidence, General Guidance, Alignment Analysis, and unknowns separate.",
        confidence: hybrid.confidence,
        reasoningSummary: [
          "Classified this as Hybrid Advice before retrieving any direct facts.",
          hybrid.evidence.length ? `Selected ${hybrid.evidence.length} relevant Identity Evidence dimension${hybrid.evidence.length === 1 ? "" : "s"}.` : "No relevant Identity Evidence was found, so the guidance remains general.",
          "Kept static general guidance separate from the Identity Genome and did not make a prediction.",
        ],
        limitations: [
          `Identity Evidence: ${hybrid.advice.evidenceBoundary.identityEvidence.join(" · ")}`,
          `General Knowledge: ${hybrid.advice.evidenceBoundary.generalKnowledge}`,
          `Unknown: ${hybrid.advice.evidenceBoundary.unknown.join(" · ")}`,
        ],
        suggestedSources: hybrid.advice.evidenceBoundary.unknown,
      }, undefined, hybrid.advice);
    }

    // Direct fact lookup only runs after classification establishes a factual
    // question. A life decision can therefore never be reduced to a career,
    // value, or relationship fact merely because it contains a matching word.
    if (intent === "identity_facts" || this.knowledgeService.intentFor(question) !== "unknown") {
      const knowledgeAnswer = this.knowledgeService.answer(question, snapshot);
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

      return this.responseBuilder.build(question, "identity_facts", {
        intent: "identity_facts",
        evidence: [],
        sections: snapshot.sections.filter((section) => section.id === "identity-facts"),
        knowledgeObjects: [],
        timeline: snapshot.timeline,
        sources: snapshot.sources.filter((source) => source.status === "ingested"),
        version: snapshot.latestVersion?.version,
        genomeConfidence: snapshot.genomeConfidence,
      }, this.knowledgeService.unavailable(question));
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

function emptyBundle(snapshot: GenomeSnapshot, intent: "prediction_boundary") {
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

function hybridBundle(snapshot: GenomeSnapshot, evidence: TwinEvidence[]) {
  const usesCommunication = evidence.some((item) => item.category === "communication");
  return {
    intent: "hybrid_advice" as const,
    evidence,
    sections: snapshot.sections.filter((section) => section.id === "identity-facts" || usesCommunication && section.id === "communication"),
    knowledgeObjects: [],
    timeline: snapshot.timeline,
    sources: snapshot.sources.filter((source) => source.status === "ingested"),
    version: snapshot.latestVersion?.version,
    genomeConfidence: snapshot.genomeConfidence,
  };
}

function predictionBoundary(question: string) {
  return {
    answer: `I can’t predict ${predictionSubject(question)}. TrustDNA can only work with evidence already present in your Identity Genome and cannot forecast personal outcomes.`,
    confidence: null,
    reasoningSummary: ["Classified this as an unknown future prediction.", "Did not retrieve unrelated Identity Evidence or generate a personal forecast."],
    limitations: ["TrustDNA does not predict relationships, death, wealth, lottery outcomes, or future events."],
    suggestedSources: [],
  };
}

function predictionSubject(question: string): string {
  if (/marry/i.test(question)) return "who you will marry";
  if (/die|pass away/i.test(question)) return "when you will die";
  if (/lottery/i.test(question)) return "lottery numbers";
  if (/rich/i.test(question)) return "whether you will become rich";
  return "your future";
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
