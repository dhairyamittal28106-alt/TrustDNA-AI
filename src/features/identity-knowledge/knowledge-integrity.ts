import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

export type KnowledgeRepair = {
  objectId: string;
  mutation: string;
};

const namePart = /^[A-Z][\p{L}'-]*$/u;

/**
 * A first-person statement is not automatically a name. Names must be a
 * concise, title-cased sequence of human-name tokens so behavior statements
 * such as “I am comfortable speaking …” can never enter the Name field.
 */
export function isHumanName(value: string): boolean {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && parts.length <= 4 && parts.every((part) => namePart.test(part));
}

/**
 * Generates an immutable, globally unique Knowledge Object identifier. IDs are
 * intentionally not derived from fact content: equal statements are handled by
 * the merger, while every created object receives its own stable identity.
 */
export function createKnowledgeObjectId(): string {
  return `fact-${globalThis.crypto.randomUUID()}`;
}

/**
 * Removes duplicate identifiers while preserving the newest record. The
 * diagnostic payload is deliberately structured so a duplicate can be traced
 * back to its object type, source, and Genome version without changing UI keys.
 */
export function deduplicateById<T extends { id: string }>(objects: T[], stage: string): T[] {
  const retained = new Map<string, T>();

  objects.forEach((candidate) => {
    const current = retained.get(candidate.id);
    if (!current) {
      retained.set(candidate.id, candidate);
      return;
    }

    const keepCandidate = isNewer(candidate, current);
    const discarded = keepCandidate ? current : candidate;
    if (keepCandidate) retained.set(candidate.id, candidate);
    logDuplicate(discarded, stage, keepCandidate ? "Replaced an older duplicate with the newest object." : "Discarded an older duplicate while preserving the newest object.");
  });

  return [...retained.values()];
}

/** Repairs invalid legacy facts and duplicate IDs before repository consumers receive them. */
export function repairStoredKnowledge(objects: IdentityKnowledgeObject[]): { objects: IdentityKnowledgeObject[]; repairs: KnowledgeRepair[] } {
  const repairs: KnowledgeRepair[] = [];
  const duplicateIds = duplicateIdCounts(objects);
  duplicateIds.forEach((count, id) => repairs.push({ objectId: id, mutation: `Removed ${count - 1} legacy duplicate object${count === 2 ? "" : "s"}; preserved the newest record.` }));

  let repaired = deduplicateById(objects, "repository load").map((object) => {
    if (object.factKey !== "name" || object.status !== "active" || isHumanName(object.value)) return object;
    repairs.push({ objectId: object.id, mutation: `Marked invalid Name value as superseded: ${object.value}` });
    return { ...object, status: "superseded" as const };
  });

  const hasActiveName = repaired.some((object) => object.factKey === "name" && object.status === "active");
  if (!hasActiveName) {
    const fallback = repaired
      .filter((object) => object.factKey === "name" && isHumanName(object.value))
      .sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp))[0];
    if (fallback) {
      const fallbackIndex = repaired.indexOf(fallback);
      repairs.push({ objectId: fallback.id, mutation: `Restored valid Name as active: ${fallback.value}` });
      repaired = repaired.map((object, index) => index === fallbackIndex ? { ...object, status: "active" as const } : object);
    }
  }

  return { objects: deduplicateById(repaired, "repository repair"), repairs };
}

function duplicateIdCounts<T extends { id: string }>(objects: T[]): Map<string, number> {
  const counts = new Map<string, number>();
  objects.forEach((object) => counts.set(object.id, (counts.get(object.id) ?? 0) + 1));
  return new Map([...counts].filter(([, count]) => count > 1));
}

function isNewer<T extends { id: string }>(candidate: T, current: T): boolean {
  const candidateRecord = metadataFor(candidate);
  const currentRecord = metadataFor(current);
  const timestampComparison = candidateRecord.timestamp.localeCompare(currentRecord.timestamp);
  if (timestampComparison !== 0) return timestampComparison > 0;
  if (candidateRecord.active !== currentRecord.active) return candidateRecord.active;
  return false;
}

function logDuplicate<T extends { id: string }>(object: T, stage: string, reason: string): void {
  const metadata = metadataFor(object);
  console.warn("[TrustDNA][knowledge-integrity] Duplicate ID", {
    "Duplicate ID": object.id,
    "Object Type": metadata.objectType,
    Source: metadata.source,
    Version: metadata.version,
    Reason: `${stage}: ${reason}`,
  });
}

function metadataFor(object: { id: string }): { objectType: string; source: string; version: string; timestamp: string; active: boolean } {
  const record = object as {
    factKey?: string;
    category?: string;
    title?: string;
    status?: string;
    updatedAt?: string;
    sources?: string[];
    evidenceSources?: string[];
    provenance?: { source?: string; version?: string; timestamp?: string };
  };
  return {
    objectType: record.factKey ?? record.category ?? record.title ?? "Knowledge Object",
    source: record.provenance?.source ?? record.sources?.join(", ") ?? record.evidenceSources?.join(", ") ?? "Unknown source",
    version: record.provenance?.version ?? "Current Genome",
    timestamp: record.provenance?.timestamp ?? record.updatedAt ?? "",
    active: record.status === undefined || record.status === "active",
  };
}
