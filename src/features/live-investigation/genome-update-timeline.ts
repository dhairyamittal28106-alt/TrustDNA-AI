import { buildGenomeSnapshot } from "@/features/identity-intelligence/adapter";
import type { SourceRecord } from "@/features/identity-intelligence/types";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { GenomeUpdate } from "@/features/live-investigation/types";

 
export class GenomeUpdateTimeline {
  async record(update: GenomeUpdate, sources: SourceRecord[], knowledge: IdentityKnowledgeObject[]) {
    return buildGenomeSnapshot(update, sources, knowledge);
  }
}
