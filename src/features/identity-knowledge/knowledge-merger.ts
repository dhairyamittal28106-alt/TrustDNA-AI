import type { IdentityKnowledgeObject, KnowledgeMergeResult } from "@/features/identity-knowledge/types";

/** Keeps conflicting statements as history while making the newest literal statement active. */
export class KnowledgeMerger {
  merge(existing: IdentityKnowledgeObject[], incoming: IdentityKnowledgeObject[]): KnowledgeMergeResult {
    let objects = [...existing];
    const added: IdentityKnowledgeObject[] = [];
    const updated: Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }> = [];

    for (const next of incoming) {
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

function sameValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}
