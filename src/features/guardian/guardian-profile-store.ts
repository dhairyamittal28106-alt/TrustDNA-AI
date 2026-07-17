function storageKey(userId: string): string {
  return `trustdna:guardian-profile:${userId}`;
}

/** A local visual preference only. The uploaded image stays in this browser session and is never sent to the Guardian engine. */
export const guardianProfileStore = {
  load(userId: string): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(storageKey(userId));
  },

  save(userId: string, dataUrl: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(userId), dataUrl);
  },
};
