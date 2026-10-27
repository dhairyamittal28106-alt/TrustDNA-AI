import { IdentityDimensionBuilder } from "@/features/identity-reasoning/identity-dimension-builder";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { IdentityDimension } from "@/features/identity-reasoning/types";

 
export class CareerProfileBuilder {
  constructor(private readonly dimensions = new IdentityDimensionBuilder()) {}

  build(facts: IdentityKnowledgeObject[]): IdentityDimension | null {
    return this.dimensions.fromFacts("career", "Career Direction", facts.filter((fact) => fact.factKey === "career"));
  }
}
