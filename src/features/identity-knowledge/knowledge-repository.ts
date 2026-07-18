import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import { repairStoredKnowledge } from "@/features/identity-knowledge/knowledge-integrity";

const knownTechnicalValues = new Set([
  "angular", "c", "c++", "c#", "dart", "django", "fastapi", "flask", "go", "java", "javascript", "kotlin", "laravel", "next.js", "nextjs", "node.js", "nodejs", "php", "python", "r", "react", "react native", "ruby", "rust", "spring", "swift", "tailwind", "typescript", "vue", "vue.js",
]);

function storageKey(userId: string): string {
  return `trustdna:identity-knowledge:${userId}`;
}

/** Stores structured facts and compact provenance in this browser session only; never raw source documents. */
export const knowledgeRepository = {
  load(userId: string): IdentityKnowledgeObject[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(storageKey(userId));
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const legacySafe = supersedeAmbiguousLegacyFacts(parsed as IdentityKnowledgeObject[]);
      const repaired = repairStoredKnowledge(legacySafe);
      if (repaired.repairs.length) {
        window.sessionStorage.setItem(storageKey(userId), JSON.stringify(repaired.objects));
        console.warn("[TrustDNA][knowledge-integrity] Repaired stored Knowledge Objects", repaired.repairs);
      }
      return repaired.objects;
    } catch {
      return [];
    }
  },

  save(userId: string, objects: IdentityKnowledgeObject[]): void {
    if (typeof window === "undefined") return;
    const repaired = repairStoredKnowledge(objects);
    if (repaired.repairs.length) console.warn("[TrustDNA][knowledge-integrity] Repaired Knowledge Objects before persistence", repaired.repairs);
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(repaired.objects));
  },

  clear(userId: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(userId));
  },
};

/**
 * Keeps historic evidence visible but prevents a pre-12.6 ambiguous phrase
 * such as "the right ps" from remaining an active technical skill.
 */
function supersedeAmbiguousLegacyFacts(objects: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
  return objects.map((fact) => {
    if (fact.status !== "active" || !["skill", "technology"].includes(fact.factKey)) return fact;
    return knownTechnicalValues.has(fact.value.trim().toLocaleLowerCase()) ? fact : { ...fact, status: "superseded" as const };
  });
}
