/**
 * Preserves the first occurrence of each immutable Knowledge Object ID while
 * making evidence joins observable. Evidence can be selected by more than one
 * deterministic dimension, but it must be rendered only once.
 */
export type EvidencePipelineStage =
  | "selectedEvidence"
  | "reasoningEvidence"
  | "advisorEvidence"
  | "displayEvidence"
  | "auditTrail";

type EvidenceRecord = {
  id: string;
  category?: string;
  factKey?: string;
  title?: string;
  source?: string;
  sources?: string[];
  evidenceSources?: string[];
  version?: string;
  provenance?: { source?: string; version?: string };
};

/**
 * Merges evidence arrays without allowing the same immutable object reference
 * to enter a later Twin pipeline stage twice.
 */
export function mergeEvidence<T extends { id: string }>(stage: EvidencePipelineStage, ...arrays: ReadonlyArray<ReadonlyArray<T>>): T[] {
  const incoming = arrays.flatMap((array) => array);
  const before = incoming.map(describeEvidence);
  console.debug("[TrustDNA][evidence-assembly] Before merge", {
    "Source pipeline stage": stage,
    count: incoming.length,
    evidence: before,
  });

  const unique = new Map<string, T>();
  const removed: Array<ReturnType<typeof describeEvidence>> = [];
  incoming.forEach((item) => {
    if (unique.has(item.id)) {
      removed.push(describeEvidence(item));
      return;
    }
    unique.set(item.id, item);
  });

  const merged = Array.from(unique.values());
  if (removed.length) {
    console.warn("[TrustDNA][evidence-assembly] Duplicate IDs removed", {
      "Source pipeline stage": stage,
      "Duplicate IDs removed": removed,
      beforeCount: incoming.length,
      afterCount: merged.length,
    });
  }
  console.debug("[TrustDNA][evidence-assembly] After merge", {
    "Source pipeline stage": stage,
    count: merged.length,
    evidence: merged.map(describeEvidence),
  });

  return merged;
}

function describeEvidence(item: { id: string }): { id: string; objectType: string; source: string; version: string } {
  const record = item as EvidenceRecord;
  return {
    id: record.id,
    objectType: record.factKey ?? record.category ?? record.title ?? "Knowledge Object",
    source: record.provenance?.source ?? record.source ?? record.sources?.join(", ") ?? record.evidenceSources?.join(", ") ?? "Unknown source",
    version: record.provenance?.version ?? record.version ?? "Current Genome",
  };
}
