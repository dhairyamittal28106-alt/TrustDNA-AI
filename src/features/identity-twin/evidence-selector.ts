import type { GenomeSection, KnowledgeObject } from "@/features/identity-intelligence/types";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";
import { deduplicateById } from "@/features/identity-knowledge/knowledge-integrity";
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
    const sections = deduplicateById(retrieved.sections.filter(isExplainable), "Twin evidence section selection");
    const knowledgeObjects = mergeEvidence("selectedEvidence", retrieved.knowledgeObjects.filter(isExplainable));
    const evidence = mergeEvidence("displayEvidence", knowledgeObjects.map(toEvidence));

    return {
      intent,
      evidence: mergeEvidence("selectedEvidence", evidence),
      sections,
      knowledgeObjects,
      // Timeline entries are displayed as existing Genome references only. They are
      // never treated as evidence for a personal claim unless an extractor marks it so.
      timeline: deduplicateById(retrieved.timeline, "Twin evidence timeline"),
      sources: deduplicateById(retrieved.sources.filter((source) => source.status === "ingested"), "Twin evidence sources"),
      version: retrieved.version,
      genomeConfidence: retrieved.confidence,
    };
  }

  sectionTitles(sections: GenomeSection[]): string[] {
    return sections.map((section) => section.title);
  }
}
