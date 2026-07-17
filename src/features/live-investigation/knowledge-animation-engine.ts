import { IdentityKnowledgeExtractor } from "@/features/identity-knowledge/identity-knowledge-extractor";
import { KnowledgeMerger } from "@/features/identity-knowledge/knowledge-merger";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

/** Runs real deterministic fact extraction, then returns only its actual merge result for the UI to reveal. */
export class KnowledgeAnimationEngine {
  private readonly extractor = new IdentityKnowledgeExtractor();
  private readonly merger = new KnowledgeMerger();

  extract(input: { content: string; sourceLabel: string; genomeVersion: string; timestamp: string }, existing: IdentityKnowledgeObject[]) {
    return this.merger.merge(existing, this.extractor.extract(input));
  }
}
