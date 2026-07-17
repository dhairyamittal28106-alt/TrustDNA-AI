import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

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
      return Array.isArray(parsed) ? parsed as IdentityKnowledgeObject[] : [];
    } catch {
      return [];
    }
  },

  save(userId: string, objects: IdentityKnowledgeObject[]): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(objects));
  },

  clear(userId: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(userId));
  },
};
