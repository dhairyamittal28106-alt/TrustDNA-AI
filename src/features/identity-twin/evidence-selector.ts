import type { GenomeSection, KnowledgeObject } from "@/features/identity-intelligence/types";
import type { TwinEvidence, TwinEvidenceBundle, TwinIntent, TwinRetrievedGenome } from "@/features/identity-twin/types";

function isExplainable(item: { origin: string }): boolean {
  return item.origin === "extracted";
}

function toEvidence(item: KnowledgeObject): TwinEvidence {
  return {
    id: item.id,
    title: item.title,
    detail: item.description ? `${item.value}. ${item.description}` : item.value,
    category: item.category,
    origin: item.origin,
    sources: item.evidenceSources,
    updatedAt: item.updatedAt,
  };
}

export class EvidenceSelector {
  select(intent: TwinIntent, retrieved: TwinRetrievedGenome): TwinEvidenceBundle {
    const sections = retrieved.sections.filter(isExplainable);
    const knowledgeObjects = retrieved.knowledgeObjects.filter(isExplainable);
    const evidence = knowledgeObjects.map(toEvidence);

    return {
      intent,
      evidence,
      sections,
      knowledgeObjects,
      // Timeline entries are displayed as existing Genome references only. They are
      // never treated as evidence for a personal claim unless an extractor marks it so.
      timeline: retrieved.timeline,
      sources: retrieved.sources.filter((source) => source.status === "ingested"),
      version: retrieved.version,
      genomeConfidence: retrieved.confidence,
    };
  }

  sectionTitles(sections: GenomeSection[]): string[] {
    return sections.map((section) => section.title);
  }
}
