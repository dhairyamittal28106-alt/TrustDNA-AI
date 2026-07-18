import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { ExplicitProfileSignal } from "@/features/identity-reasoning/identity-dimension-builder";

const valueDefinitions = [
  { value: "Learning", pattern: /\b(learn|learning|knowledge)\b/i },
  { value: "Ownership", pattern: /\b(ownership|own(?:er|ership)?|entrepreneur|startup|start-up|founder)\b/i },
  { value: "Honesty", pattern: /\b(honesty|honest|integrity|truth)\b/i },
  { value: "Discipline", pattern: /\b(discipline|disciplined|consistent|consistency)\b/i },
  { value: "Curiosity", pattern: /\b(curious|curiosity|explore|exploring)\b/i },
  { value: "Helping people", pattern: /\b(help(?:ing)? (?:people|others)|impact|serve)\b/i },
  { value: "Financial independence", pattern: /\b(financial independence|financially independent)\b/i },
  { value: "Innovation", pattern: /\b(innovation|innovative|invent|new ideas?)\b/i },
] as const;

/** Maps explicit value language to a small controlled vocabulary with source excerpts. */
export class ValueExtractor {
  extract(facts: IdentityKnowledgeObject[]): ExplicitProfileSignal[] {
    return facts.flatMap((fact) => valueDefinitions
      .filter((definition) => definition.pattern.test(fact.provenance.evidence) || definition.pattern.test(fact.value))
      .map((definition) => ({
        id: fact.id,
        value: definition.value,
        source: fact.provenance.source,
        evidence: fact.provenance.evidence,
        version: fact.provenance.version,
        timestamp: fact.provenance.timestamp,
        confidence: fact.provenance.confidence,
      })));
  }
}
