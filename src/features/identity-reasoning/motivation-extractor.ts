import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { ExplicitProfileSignal } from "@/features/identity-reasoning/identity-dimension-builder";

/** Uses directly stated dreams, goals, and career aims as motivation evidence. */
export class MotivationExtractor {
  extract(facts: IdentityKnowledgeObject[]): ExplicitProfileSignal[] {
    return facts
      .filter((fact) => ["dream", "goal", "career"].includes(fact.factKey))
      .map((fact) => ({
        id: fact.id,
        value: fact.value,
        source: fact.provenance.source,
        evidence: fact.provenance.evidence,
        version: fact.provenance.version,
        timestamp: fact.provenance.timestamp,
        confidence: fact.provenance.confidence,
      }));
  }
}
