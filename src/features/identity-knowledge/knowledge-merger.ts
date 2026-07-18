import { createKnowledgeObjectId, repairStoredKnowledge } from "@/features/identity-knowledge/knowledge-integrity";
import type { IdentityKnowledgeObject, KnowledgeMergeResult } from "@/features/identity-knowledge/types";

/** Keeps conflicting statements as history while making the newest literal statement active. */
export class KnowledgeMerger {
  merge(existing: IdentityKnowledgeObject[], incoming: IdentityKnowledgeObject[]): KnowledgeMergeResult {
    let objects = repairStoredKnowledge(existing).objects;
    const added: IdentityKnowledgeObject[] = [];
    const updated: Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }> = [];

    for (const incomingObject of incoming) {
      const next = ensureIncomingId(objects, incomingObject);
      if (next.status === "superseded") {
        const alreadyRecorded = objects.some((item) => item.factKey === next.factKey && item.status === "superseded" && sameValue(item.value, next.value));
        if (!alreadyRecorded) {
          objects = [...objects, next];
          added.push(next);
        }
        continue;
      }

      if (isMultiValueFact(next.factKey)) {
        const alreadyStored = objects.some((item) => item.factKey === next.factKey && sameValue(item.value, next.value));
        if (!alreadyStored) {
          objects = [...objects, next];
          added.push(next);
        }
        continue;
      }

      const active = objects.find((item) => item.factKey === next.factKey && item.status === "active");
      if (active && sameValue(active.value, next.value)) continue;

      if (active) {
        const previous = { ...active, status: "superseded" as const };
        objects = objects.map((item) => item.id === active.id ? previous : item);
        updated.push({ previous, current: next });
      } else {
        added.push(next);
      }
      objects = [...objects, next];
    }

    const repaired = repairStoredKnowledge(objects).objects;
    return {
      objects: repaired,
      added: added.filter((object) => repaired.some((stored) => stored.id === object.id)),
      updated: updated.filter(({ previous, current }) => repaired.some((stored) => stored.id === previous.id || stored.id === current.id)),
    };
  }
}

function ensureIncomingId(existing: IdentityKnowledgeObject[], incoming: IdentityKnowledgeObject): IdentityKnowledgeObject {
  const collision = existing.find((object) => object.id === incoming.id);
  if (!collision || sameFact(collision, incoming)) return incoming;
  const id = createKnowledgeObjectId();
  console.warn("[TrustDNA][knowledge-integrity] Duplicate ID", {
    "Duplicate ID": incoming.id,
    "Object Type": incoming.factKey,
    Source: incoming.provenance.source,
    Version: incoming.provenance.version,
    Reason: `knowledge merge: generated ${id} for an incoming object that collided with an existing immutable ID.`,
  });
  return { ...incoming, id };
}

/** Facts such as projects and skills are additive, not mutually exclusive profile fields. */
function isMultiValueFact(factKey: string): boolean {
  return ["goal", "dream", "project", "programming_language", "framework", "skill", "technology", "interest", "book", "sport", "value", "motivation"].includes(factKey);
}

function sameValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}

function sameFact(left: IdentityKnowledgeObject, right: IdentityKnowledgeObject): boolean {
  return left.factKey === right.factKey && left.status === right.status && sameValue(left.value, right.value);
}
