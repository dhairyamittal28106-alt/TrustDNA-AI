import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { IdentityDimension, IdentityDimensionId } from "@/features/identity-reasoning/types";

type DimensionDefinition = {
  id: IdentityDimensionId;
  label: string;
  factKeys: string[];
};

const dimensions: DimensionDefinition[] = [
  { id: "goals", label: "Goals & Dreams", factKeys: ["dream", "goal"] },
  { id: "career", label: "Career Direction", factKeys: ["career"] },
  { id: "education", label: "Education", factKeys: ["university", "degree", "department", "school"] },
  { id: "projects", label: "Projects", factKeys: ["project"] },
  { id: "skills", label: "Technical Skills", factKeys: ["programming_language", "framework", "skill", "technology"] },
  { id: "interests", label: "Interests", factKeys: ["interest"] },
  { id: "sports", label: "Sports", factKeys: ["sport", "favorite_player"] },
];

/** Aggregates direct fact objects into inspectable dimensions without inferring traits. */
export class IdentityProfileAggregator {
  aggregate(snapshot: GenomeSnapshot): IdentityDimension[] {
    const activeFacts = snapshot.knowledgeHistory.filter((fact) => fact.status === "active");
    const structuredDimensions = dimensions
      .map((definition) => this.toDimension(definition, activeFacts))
      .filter((dimension): dimension is IdentityDimension => dimension !== null);

    const communication = this.communicationDimension(snapshot);
    return communication ? [...structuredDimensions, communication] : structuredDimensions;
  }

  private toDimension(definition: DimensionDefinition, facts: IdentityKnowledgeObject[]): IdentityDimension | null {
    const matchingFacts = facts.filter((fact) => definition.factKeys.includes(fact.factKey));
    if (!matchingFacts.length) return null;

    const newest = [...matchingFacts].sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp))[0];
    const confidence = average(matchingFacts.map((fact) => fact.provenance.confidence));
    return {
      id: definition.id,
      label: definition.label,
      value: matchingFacts.map((fact) => fact.value).join(" · "),
      confidence,
      source: unique(matchingFacts.map((fact) => fact.provenance.source)).join(", "),
      evidence: matchingFacts.map((fact) => `“${fact.provenance.evidence}”`).join(" "),
      version: newest.provenance.version,
      timestamp: newest.provenance.timestamp,
      evidenceIds: matchingFacts.map((fact) => fact.id),
    };
  }

  private communicationDimension(snapshot: GenomeSnapshot): IdentityDimension | null {
    const features = snapshot.features;
    if (!features || snapshot.genomeConfidence === undefined) return null;

    const source = snapshot.sources.filter((item) => item.status === "ingested").map((item) => item.label).join(", ") || "Analyzed text evidence";
    const version = snapshot.latestVersion?.version ?? "Current Genome";
    const timestamp = snapshot.profile?.updated_at ?? snapshot.latestVersion?.created_at ?? "Unknown";
    return {
      id: "communication",
      label: "Communication Measurements",
      value: `Professional tone ${Math.round(features.professional_tone * 100)}% · average sentence length ${Math.round(features.average_sentence_length)} words`,
      confidence: snapshot.genomeConfidence / 100,
      source,
      evidence: "Deterministic metrics measured from consented analyzed text.",
      version,
      timestamp,
      evidenceIds: ["measured-communication"],
    };
  }
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
