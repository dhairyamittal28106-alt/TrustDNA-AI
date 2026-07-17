import { EvidenceSelector } from "@/features/identity-twin/evidence-selector";
import { GenomeRetriever } from "@/features/identity-twin/genome-retriever";
import { IntentDetector } from "@/features/identity-twin/intent-detector";
import { ReasoningEngine } from "@/features/identity-twin/reasoning-engine";
import { TwinResponseBuilder } from "@/features/identity-twin/response-builder";
import { TwinKnowledgeService } from "@/features/identity-knowledge/twin-knowledge-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinResponse } from "@/features/identity-twin/types";

export class IdentityTwinService {
  constructor(
    private readonly intentDetector = new IntentDetector(),
    private readonly genomeRetriever = new GenomeRetriever(),
    private readonly evidenceSelector = new EvidenceSelector(),
    private readonly reasoningEngine = new ReasoningEngine(),
    private readonly responseBuilder = new TwinResponseBuilder(),
    private readonly knowledgeService = new TwinKnowledgeService(),
  ) {}

  answer(question: string, snapshot: GenomeSnapshot): TwinResponse {
    const intent = this.intentDetector.detect(question);
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
    const retrievedGenome = this.genomeRetriever.retrieve(snapshot, intent);
    const evidence = this.evidenceSelector.select(intent, retrievedGenome);
    const reasoning = this.reasoningEngine.reason(intent, evidence);
    return this.responseBuilder.build(question, intent, evidence, reasoning);
  }
}
