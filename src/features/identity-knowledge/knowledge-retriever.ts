import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

const queryTerms: Array<{ pattern: RegExp; keys: string[] }> = [
  { pattern: /\b(name|who am i|about me)\b/i, keys: ["name"] },
  { pattern: /\b(dream|ambition)\b/i, keys: ["dream"] },
  { pattern: /\b(goal|goals)\b/i, keys: ["goal", "dream"] },
  { pattern: /\b(university|college|school|study|degree|education)\b/i, keys: ["university", "degree"] },
  { pattern: /\b(favorite|cricketer|player|team|sport)\b/i, keys: ["favorite_player", "favorite_team"] },
  { pattern: /\b(project|projects)\b/i, keys: ["project"] },
  { pattern: /\b(skill|skills)\b/i, keys: ["skill"] },
  { pattern: /\b(technology|technologies|framework|tool)\b/i, keys: ["technology"] },
  { pattern: /\b(role|career|job)\b/i, keys: ["current_role"] },
  { pattern: /\b(timeline|milestone|started|completed|won)\b/i, keys: ["timeline_event"] },
];

export class KnowledgeRetriever {
  retrieve(question: string, objects: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    const active = objects.filter((item) => item.status === "active");
    if (/\b(who am i|about me|summarize|summary|identity)\b/i.test(question)) return active.slice(0, 6);
    const matched = queryTerms.find((entry) => entry.pattern.test(question));
    if (matched) return active.filter((item) => matched.keys.includes(item.factKey));
    return [];
  }
}
