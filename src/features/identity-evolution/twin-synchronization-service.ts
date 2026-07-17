import type { TwinSynchronizationUpdate } from "@/features/identity-evolution/types";

const updateEventName = "trustdna:genome-evolved";

export class TwinSynchronizationService {
  publish(update: TwinSynchronizationUpdate): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<TwinSynchronizationUpdate>(updateEventName, { detail: update }));
  }

  subscribe(userId: string, onUpdate: (update: TwinSynchronizationUpdate) => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const listener = (event: Event) => {
      const update = (event as CustomEvent<TwinSynchronizationUpdate>).detail;
      if (update?.userId === userId) onUpdate(update);
    };
    window.addEventListener(updateEventName, listener);
    return () => window.removeEventListener(updateEventName, listener);
  }
}
