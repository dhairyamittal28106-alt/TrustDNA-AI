import { buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import type { SourceRecord } from "@/features/identity-intelligence/types";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { GenomeUpdate } from "@/features/live-investigation/types";

/** Keeps the visual timeline tied to the exact snapshot returned by the ingestion contract. */
export class GenomeUpdateTimeline {
  async record(update: GenomeUpdate, sources: SourceRecord[], knowledge: IdentityKnowledgeObject[]) {
    return buildGenomeSnapshot(update, sources, knowledge);
  }
}
