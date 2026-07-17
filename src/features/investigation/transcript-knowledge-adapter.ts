import type { EvidenceDraft } from "@/features/investigation/types";

export class TranscriptKnowledgeAdapter {
  contentForInvestigation(draft: EvidenceDraft): { content: string; sourceLabel: string } | null {
    const content = draft.text.trim();
    if (!content) return null;
    if (draft.kind === "image") return null;
    const suffix = draft.kind === "voice" ? " · verified transcript" : "";
    return { content, sourceLabel: `${draft.sourceLabel.trim() || "Consented evidence"}${suffix}` };
  }
}
