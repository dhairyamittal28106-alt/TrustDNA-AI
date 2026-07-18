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

/** Repairs only known invalid legacy Name objects and preserves their history. */
export function repairStoredKnowledge(objects: IdentityKnowledgeObject[]): { objects: IdentityKnowledgeObject[]; repairs: KnowledgeRepair[] } {
  const repairs: KnowledgeRepair[] = [];
  let repaired = objects.map((object) => {
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

  return { objects: repaired, repairs };
}
