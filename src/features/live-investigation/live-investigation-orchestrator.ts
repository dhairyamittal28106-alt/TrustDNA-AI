import type { LiveInvestigationEvent, LiveInvestigationInput } from "@/features/live-investigation/types";

/** Streams actual BFF completion events; it never manufactures an investigation result or timing sequence. */
export class LiveInvestigationOrchestrator {
  async run(input: LiveInvestigationInput, onEvent: (event: LiveInvestigationEvent) => Promise<void> | void): Promise<void> {
    const response = await fetch("/api/live-investigation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok || !response.body) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(error?.message ?? "The secure investigation service could not be reached.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() ?? "";
      for (const message of messages) {
        const type = message.match(/^event:\s*(.+)$/m)?.[1];
        const payload = message.match(/^data:\s*(.+)$/m)?.[1];
        if (!type || !payload) continue;
        await onEvent({ type: type as LiveInvestigationEvent["type"], data: JSON.parse(payload) });
      }
    }
  }
}
