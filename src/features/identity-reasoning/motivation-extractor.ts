import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { ExplicitProfileSignal } from "@/features/identity-reasoning/identity-dimension-builder";

/** Uses only explicit motivation statements; goals, dreams, and career stay separate dimensions. */
export class MotivationExtractor {
  extract(facts: IdentityKnowledgeObject[]): ExplicitProfileSignal[] {
    return facts
      .filter((fact) => fact.factKey === "motivation")
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
