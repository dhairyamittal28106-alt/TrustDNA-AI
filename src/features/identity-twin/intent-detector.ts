import type { TwinIntent } from "@/features/identity-twin/types";

const intentPatterns: Array<{ intent: TwinIntent; pattern: RegExp }> = [
  { intent: "artifact_comparison", pattern: /\b(this|an|the)\s+(email|message|artifact|document|resume)|\bdoes\s+(this|it).{0,40}\bsound\s+like\s+me\b|\bcompare\b/i },
  { intent: "identity_reasoning", pattern: /\b(summarize|summary|motivat|strength|weakness|career\s+(?:suits?|fit|path)|what\s+career|entrepreneur|founder|management|manager|leadership|higher\s+studies|master'?s|move\s+abroad|relocat|startup|start-up|align(?:ment)?|supporting\s+evidence|why\s+(?:do\s+you\s+)?recommend|should\s+i|would\s+i|could\s+i)\b/i },
  { intent: "identity_facts", pattern: /\b(name|who\s+am\s+i|dream|ambition|university|college|school|degree|education|favorite|cricketer|player|team|project|projects|skill|skills|technology|technologies|goal|goals|current role|timeline)\b/i },
  { intent: "evidence_requirements", pattern: /\b(job|internship|preference|future|values|interest|relationship)\b/i },
  { intent: "observed_knowledge", pattern: /\b(technology|technologies|skill|skills|domain|expertise|knowledge|know|terms)\b/i },
  { intent: "communication", pattern: /\b(communication|communicate|writing|write|email|tone|vocabulary|greeting|signature|sentence|punctuation|style)\b/i },
  { intent: "identity_summary", pattern: /\b(summarize|summary|who\s+am\s+i|about\s+me|identity\s+profile|profile)\b/i },
];

export class IntentDetector {
  detect(question: string): TwinIntent {
    return intentPatterns.find(({ pattern }) => pattern.test(question))?.intent ?? "unknown";
  }
}
