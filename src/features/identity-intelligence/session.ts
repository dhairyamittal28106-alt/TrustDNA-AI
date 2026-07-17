import type { GenomeSession, SourceRecord } from "@/features/identity-intelligence/types";

function storageKey(userId: string): string {
  return `trustdna:intelligence:${userId}`;
}

/** Stores opaque IDs and source metadata for the active browser session only. Raw source text is never stored here. */
export const browserGenomeStore = {
  load(userId: string): GenomeSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(storageKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<GenomeSession>;
      if (typeof parsed.genomeId !== "string" || typeof parsed.ownerId !== "string" || !Array.isArray(parsed.sources)) return null;
      return { genomeId: parsed.genomeId, ownerId: parsed.ownerId, sources: parsed.sources as SourceRecord[] };
    } catch {
      return null;
    }
  },

  save(userId: string, value: GenomeSession): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(value));
  },

  clear(userId: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(userId));
  },
};

export function addSessionSource(session: GenomeSession, source: SourceRecord): GenomeSession {
  return { ...session, sources: [...session.sources, source] };
}
