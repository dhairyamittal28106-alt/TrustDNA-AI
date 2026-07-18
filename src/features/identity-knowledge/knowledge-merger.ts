import type { IdentityKnowledgeObject, KnowledgeMergeResult } from "@/features/identity-knowledge/types";

/** Keeps conflicting statements as history while making the newest literal statement active. */
export class KnowledgeMerger {
  merge(existing: IdentityKnowledgeObject[], incoming: IdentityKnowledgeObject[]): KnowledgeMergeResult {
    let objects = [...existing];
    const added: IdentityKnowledgeObject[] = [];
    const updated: Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }> = [];

    for (const next of incoming) {
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

    return { objects, added, updated };
  }
}

/** Facts such as projects and skills are additive, not mutually exclusive profile fields. */
function isMultiValueFact(factKey: string): boolean {
  return ["goal", "dream", "project", "programming_language", "framework", "skill", "technology", "interest", "sport"].includes(factKey);
}

function sameValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}
