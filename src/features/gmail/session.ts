import type { GmailConnectionRecord } from "@/features/gmail/types";

const updateEventName = "trustdna:gmail-connection-updated";
const connectionCache = new Map<string, GmailConnectionRecord | null>();

function storageKey(userId: string): string {
  return `trustdna:gmail:${userId}`;
}

/** Stores connection metadata only. OAuth access tokens and Gmail message content are never persisted here. */
export const gmailConnectionStore = {
  load(userId: string): GmailConnectionRecord | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(storageKey(userId));
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<GmailConnectionRecord>;
      if (typeof value.email !== "string" || typeof value.connectedAt !== "string") return null;
      return {
        email: value.email,
        connectedAt: value.connectedAt,
        lastSyncAt: typeof value.lastSyncAt === "string" ? value.lastSyncAt : undefined,
        messagesAnalyzed: typeof value.messagesAnalyzed === "number" ? value.messagesAnalyzed : 0,
        genomeId: typeof value.genomeId === "string" ? value.genomeId : undefined,
        genomeVersion: typeof value.genomeVersion === "string" ? value.genomeVersion : undefined,
        health: value.health === "healthy" || value.health === "needs_reauthorization" || value.health === "unavailable" || value.health === "error" ? value.health : "needs_reauthorization",
      };
    } catch {
      return null;
    }
  },

  save(userId: string, value: GmailConnectionRecord): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(userId), JSON.stringify(value));
    connectionCache.set(userId, value);
    window.dispatchEvent(new CustomEvent<{ userId: string }>(updateEventName, { detail: { userId } }));
  },

  clear(userId: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(userId));
    connectionCache.set(userId, null);
    window.dispatchEvent(new CustomEvent<{ userId: string }>(updateEventName, { detail: { userId } }));
  },

  snapshot(userId: string | undefined): GmailConnectionRecord | null {
    if (!userId || typeof window === "undefined") return null;
    return connectionCache.get(userId) ?? null;
  },

  subscribe(userId: string | undefined, onChange: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    if (!userId) return () => undefined;
    const listener = (event: Event) => {
      if ((event as CustomEvent<{ userId?: string }>).detail?.userId === userId) onChange();
    };
    window.addEventListener(updateEventName, listener);
    queueMicrotask(() => {
      connectionCache.set(userId, this.load(userId));
      onChange();
    });
    return () => window.removeEventListener(updateEventName, listener);
  },
};
