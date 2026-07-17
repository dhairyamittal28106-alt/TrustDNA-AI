import type { InvestigationHistoryRecord } from "@/features/investigation/types";

function storageKey(userId: string): string {
  return `trustdna:investigation-history:${userId}`;
}

/** Persists returned case metadata for the active browser session; never raw source text or media. */
export const investigationHistory = {
  load(userId: string): InvestigationHistoryRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(storageKey(userId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed as InvestigationHistoryRecord[] : [];
    } catch {
      return [];
    }
  },

  save(userId: string, records: InvestigationHistoryRecord[]): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(records.slice(0, 20)));
  },

  append(userId: string, record: InvestigationHistoryRecord): InvestigationHistoryRecord[] {
    const records = [record, ...this.load(userId).filter((item) => item.id !== record.id)];
    this.save(userId, records);
    return records;
  },
};
