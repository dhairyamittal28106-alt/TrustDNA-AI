import { IdentityDimensionBuilder } from "@/features/identity-reasoning/identity-dimension-builder";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { IdentityDimension } from "@/features/identity-reasoning/types";

/** Keeps career direction limited to direct career statements in the Identity Genome. */
export class CareerProfileBuilder {
  constructor(private readonly dimensions = new IdentityDimensionBuilder()) {}

  build(facts: IdentityKnowledgeObject[]): IdentityDimension | null {
    return this.dimensions.fromFacts("career", "Career Direction", facts.filter((fact) => fact.factKey === "career"));
  }
}
