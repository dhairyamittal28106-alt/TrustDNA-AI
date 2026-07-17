import type { TwinIntent } from "@/features/identity-twin/types";

const intentPatterns: Array<{ intent: TwinIntent; pattern: RegExp }> = [
  { intent: "artifact_comparison", pattern: /\b(this|an|the)\s+(email|message|artifact|document|resume)|\bdoes\s+(this|it).{0,40}\bsound\s+like\s+me\b|\bcompare\b/i },
  { intent: "evidence_requirements", pattern: /\b(career|job|internship|goal|goals|strength|weakness|decision|leadership|preference|future|values|interest|relationship)\b/i },
  { intent: "observed_knowledge", pattern: /\b(technology|technologies|skill|skills|domain|expertise|knowledge|know|terms)\b/i },
  { intent: "communication", pattern: /\b(communication|communicate|writing|write|email|tone|vocabulary|greeting|signature|sentence|punctuation|style)\b/i },
  { intent: "identity_summary", pattern: /\b(summarize|summary|who\s+am\s+i|about\s+me|identity\s+profile|profile)\b/i },
];

export class IntentDetector {
  detect(question: string): TwinIntent {
    return intentPatterns.find(({ pattern }) => pattern.test(question))?.intent ?? "unknown";
  }
}
