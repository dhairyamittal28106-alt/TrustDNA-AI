import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";

const queryTerms: Array<{ pattern: RegExp; keys: string[] }> = [
  { pattern: /\b(name|who am i|about me)\b/i, keys: ["name"] },
  { pattern: /\b(dream|ambition)\b/i, keys: ["dream"] },
  { pattern: /\b(goal|goals)\b/i, keys: ["goal", "dream"] },
  { pattern: /\b(where do i (?:study|attend)|university|college)\b/i, keys: ["university"] },
  { pattern: /\b(degree|education|school)\b/i, keys: ["degree", "school"] },
  { pattern: /\b(favorite|favourite|cricketer|player)\b/i, keys: ["favorite_player"] },
  { pattern: /\b(sport|sports)\b/i, keys: ["sport"] },
  { pattern: /\b(project|projects)\b/i, keys: ["project"] },
  { pattern: /\b(skill|skills|programming language|language)\b/i, keys: ["programming_language", "framework", "skill"] },
  { pattern: /\b(technology|technologies|framework|tool)\b/i, keys: ["framework", "programming_language", "technology"] },
  { pattern: /\b(role|career|job|become|work as)\b/i, keys: ["career"] },
  { pattern: /\b(interest|interests|enjoy|like)\b/i, keys: ["interest"] },
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
