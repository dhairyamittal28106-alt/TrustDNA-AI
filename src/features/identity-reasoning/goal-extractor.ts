import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

/** Selects directly stated goals and dreams; no goal is inferred from vocabulary. */
export class GoalExtractor {
  goals(facts: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    return facts.filter((fact) => fact.factKey === "goal");
  }

  dreams(facts: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    return facts.filter((fact) => fact.factKey === "dream");
  }
}
