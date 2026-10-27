import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

 
export class GoalExtractor {
  goals(facts: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    return facts.filter((fact) => fact.factKey === "goal");
  }

  dreams(facts: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    return facts.filter((fact) => fact.factKey === "dream");
  }
}
