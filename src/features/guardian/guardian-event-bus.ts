import type { GuardianEvent } from "@/features/guardian/types";

const eventName = "trustdna:guardian-event";

export class GuardianEventBus {
  publish(type: GuardianEvent["type"], detail?: string): GuardianEvent {
    const event: GuardianEvent = { id: `guardian-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, detail, timestamp: new Date().toISOString() };
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<GuardianEvent>(eventName, { detail: event }));
    return event;
  }

  subscribe(onEvent: (event: GuardianEvent) => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<GuardianEvent>).detail;
      if (detail) onEvent(detail);
    };
    window.addEventListener(eventName, listener);
    return () => window.removeEventListener(eventName, listener);
  }
}
