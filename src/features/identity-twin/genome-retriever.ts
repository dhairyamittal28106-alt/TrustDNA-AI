import type { GenomeSection, GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { TwinIntent, TwinRetrievedGenome } from "@/features/identity-twin/types";

const sectionIdsForIntent: Record<TwinIntent, string[]> = {
  identity_facts: ["identity-facts"],
  communication: ["communication", "writing", "professional"],
  observed_knowledge: ["vocabulary"],
  artifact_comparison: ["communication", "writing", "professional"],
  evidence_requirements: [],
  identity_summary: ["communication", "writing", "vocabulary", "professional"],
  unknown: [],
};

export class GenomeRetriever {
  retrieve(snapshot: GenomeSnapshot, intent: TwinIntent): TwinRetrievedGenome {
    const included = sectionIdsForIntent[intent];
    const sections = included.length
      ? snapshot.sections.filter((section) => included.includes(section.id))
      : [];

    return {
      snapshot,
      sections,
      knowledgeObjects: sections.flatMap((section) => section.traits),
      timeline: snapshot.timeline,
      sources: snapshot.sources,
      version: snapshot.latestVersion?.version,
      confidence: snapshot.genomeConfidence,
    };
  }

  getAllExplainableSections(snapshot: GenomeSnapshot): GenomeSection[] {
    return snapshot.sections.filter((section) => section.origin !== "awaiting_evidence");
  }
}
