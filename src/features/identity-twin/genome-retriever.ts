import type { GenomeSection, GenomeSnapshot } from "@/features/identity-intelligence/types";
import { deduplicateById } from "@/features/identity-knowledge/knowledge-integrity";
import type { TwinIntent, TwinRetrievedGenome } from "@/features/identity-twin/types";

const sectionIdsForIntent: Record<TwinIntent, string[]> = {
  identity_facts: ["identity-facts"],
  communication: ["communication", "writing", "professional"],
  observed_knowledge: ["vocabulary"],
  artifact_comparison: ["communication", "writing", "professional"],
  evidence_requirements: [],
  identity_summary: ["communication", "writing", "vocabulary", "professional"],
  identity_reasoning: ["identity-facts", "communication", "writing", "professional"],
  hybrid_advice: [],
  prediction_boundary: [],
  unknown: [],
};

export class GenomeRetriever {
  retrieve(snapshot: GenomeSnapshot, intent: TwinIntent): TwinRetrievedGenome {
    const included = sectionIdsForIntent[intent];
    const sections = included.length
      ? snapshot.sections.filter((section) => included.includes(section.id))
      : [];
    const knowledgeObjects = deduplicateById(sections.flatMap((section) => section.traits), "Twin genome retriever");

    return {
      snapshot,
      sections,
      knowledgeObjects,
      timeline: deduplicateById(snapshot.timeline, "Twin genome retriever timeline"),
      sources: deduplicateById(snapshot.sources, "Twin genome retriever sources"),
      version: snapshot.latestVersion?.version,
      confidence: snapshot.genomeConfidence,
    };
  }

  getAllExplainableSections(snapshot: GenomeSnapshot): GenomeSection[] {
    return snapshot.sections.filter((section) => section.origin !== "awaiting_evidence");
  }
}
