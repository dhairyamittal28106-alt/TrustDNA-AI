import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import { deduplicateById } from "@/features/identity-knowledge/knowledge-integrity";

export type KnowledgeRetrievalIntent =
  | "identity"
  | "date_of_birth"
  | "university"
  | "degree"
  | "branch"
  | "education"
  | "motivation"
  | "values"
  | "goals"
  | "dreams"
  | "career"
  | "projects"
  | "technical_skills"
  | "sports"
  | "favorite_player"
  | "interests"
  | "unknown";

type RetrievalDefinition = {
  intent: Exclude<KnowledgeRetrievalIntent, "unknown">;
  pattern: RegExp;
  factKeys: string[];
  includeHistory?: boolean;
};

/**
 * Ordered, deterministic question-to-ontology mapping. A direct fact question
 * can only retrieve its declared fact keys; it never falls back to a broad
 * Identity Genome search.
 */
const retrievalPriority: RetrievalDefinition[] = [
  { intent: "identity", pattern: /\b(?:who\s+(?:am|are)\s+i|what(?:'s| is)\s+my\s+name|my\s+name)\b/i, factKeys: ["name"] },
  { intent: "date_of_birth", pattern: /\b(?:date\s+of\s+birth|birthday|when\s+was\s+i\s+born)\b/i, factKeys: ["date_of_birth"] },
  { intent: "university", pattern: /\b(?:where\s+(?:do|did)\s+i\s+(?:study|attend)|which\s+(?:university|college)|university|college)\b/i, factKeys: ["university"] },
  { intent: "branch", pattern: /\b(?:what(?:'s| is)\s+my\s+(?:branch|department|major)|branch|department|major|speciali[sz]ation)\b/i, factKeys: ["branch", "department"] },
  { intent: "degree", pattern: /\b(?:what(?:'s| is)\s+my\s+degree|what\s+degree\s+am\s+i\s+(?:pursuing|studying)|degree)\b/i, factKeys: ["degree", "branch", "department"] },
  { intent: "education", pattern: /\b(?:education|academic(?:s| history)?|school)\b/i, factKeys: ["university", "degree", "branch", "department", "education_start_year", "education_end_year", "education_status", "school"] },
  { intent: "motivation", pattern: /\b(?:what\s+motivates?\s+me|motivation|motivates?|drives?\s+me)\b/i, factKeys: ["motivation"] },
  { intent: "values", pattern: /\b(?:what\s+are\s+my\s+values|my\s+values|values?|priorities)\b/i, factKeys: ["value"] },
  { intent: "dreams", pattern: /\b(?:dream|ambition|aspiration)\b/i, factKeys: ["dream"] },
  { intent: "goals", pattern: /\b(?:goal|goals)\b/i, factKeys: ["goal"] },
  { intent: "career", pattern: /\b(?:role|career|job|become|work\s+as)\b/i, factKeys: ["career"] },
  { intent: "projects", pattern: /\b(?:what\s+(?:projects?|have)\s+(?:i\s+)?(?:built|created|developed)|projects?|portfolio)\b/i, factKeys: ["project"] },
  { intent: "technical_skills", pattern: /\b(?:technologies|technology|technical\s+skills?|skills?|programming\s+languages?|frameworks?|tech\s+stack|what\s+do\s+i\s+know)\b/i, factKeys: ["programming_language", "framework", "skill", "technology"] },
  { intent: "favorite_player", pattern: /\b(?:favorite|favourite|cricketer|player)\b/i, factKeys: ["favorite_player"], includeHistory: true },
  { intent: "sports", pattern: /\b(?:sport|sports)\b/i, factKeys: ["sport"] },
  { intent: "interests", pattern: /\b(?:interest|interests|enjoy|like)\b/i, factKeys: ["interest"] },
];

export function classifyKnowledgeRetrievalIntent(question: string): KnowledgeRetrievalIntent {
  return retrievalPriority.find((definition) => definition.pattern.test(question))?.intent ?? "unknown";
}

export class KnowledgeRetriever {
  retrieve(question: string, objects: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
    const definition = retrievalPriority.find((entry) => entry.pattern.test(question));
    if (!definition) return [];

    const active = objects.filter((item) => item.status === "active" && definition.factKeys.includes(item.factKey));
    if (!definition.includeHistory) return deduplicateById(active, "knowledge retriever");

    const history = objects
      .filter((item) => item.status === "superseded" && definition.factKeys.includes(item.factKey))
      .sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp));
    return deduplicateById([...active, ...history], "knowledge retriever");
  }
}
