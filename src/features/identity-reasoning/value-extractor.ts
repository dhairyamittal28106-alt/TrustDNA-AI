import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { ExplicitProfileSignal } from "@/features/identity-reasoning/identity-dimension-builder";

/** Returns only normalized value objects directly stated by the user. */
export class ValueExtractor {
  extract(facts: IdentityKnowledgeObject[]): ExplicitProfileSignal[] {
    return facts
      .filter((fact) => fact.factKey === "value")
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
