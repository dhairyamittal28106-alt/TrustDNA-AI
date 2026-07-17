import type { IdentityKnowledgeCategory, IdentityKnowledgeObject, KnowledgeExtractionInput } from "@/features/identity-knowledge/types";

type FactMatch = {
  factKey: string;
  title: string;
  value: string;
  category: IdentityKnowledgeCategory;
  evidence: string;
};

/**
 * Extracts only literal, pattern-backed statements. This intentionally does
 * not use an LLM or attempt to fill in facts that the evidence never states.
 */
export class IdentityKnowledgeExtractor {
  extract(input: KnowledgeExtractionInput): IdentityKnowledgeObject[] {
    const matches = [
      ...this.extractSingle(input.content, /\b(?:my name is|i am|i'm)\s+([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,3})\b/g, "name", "Name", "identity"),
      ...this.extractSingle(input.content, /\bmy date of birth is\s+([^.!?\n]{4,80})/gi, "date_of_birth", "Date of birth", "identity"),
      ...this.extractSingle(input.content, /\b(?:my gender is|i identify as)\s+([^.!?\n]{2,60})/gi, "gender", "Gender", "identity"),
      ...this.extractSingle(input.content, /\b(?:i live in|i am based in)\s+([A-Z][^.!?\n]{1,80})/g, "location", "Location", "identity"),
      ...this.extractSingle(input.content, /\b(?:i study at|i attend|my university is)\s+([A-Z][^.!?\n]{1,100})/g, "university", "University", "education"),
      ...this.extractSingle(input.content, /\b(?:i am pursuing|i studied|my degree is)\s+([^.!?\n]{3,100})/gi, "degree", "Degree", "education"),
      ...this.extractSingle(input.content, /\b(?:i work as|my current role is|i am currently a)\s+([^.!?\n]{3,100})/gi, "current_role", "Current role", "career"),
      ...this.extractSingle(input.content, /\b(?:my dream is to|my dream is)\s+([^.!?\n]{3,120})/gi, "dream", "Dream", "goals"),
      ...this.extractSingle(input.content, /\b(?:my goal is to|my goals are|i want to)\s+([^.!?\n]{3,120})/gi, "goal", "Goal", "goals"),
      ...this.extractSingle(input.content, /\bmy favorite (?:cricketer|player) (?:was|is now|is)\s+([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,3})\b/g, "favorite_player", "Favorite player", "sports"),
      ...this.extractSingle(input.content, /\bmy favorite team is\s+([A-Z][^.!?\n]{1,80})/g, "favorite_team", "Favorite team", "sports"),
      ...this.extractList(input.content, /\b(?:my skills include|i have experience with|i work with|i know)\s+([^.!?\n]{3,220})/gi, "skill", "Skill", "skills"),
      ...this.extractList(input.content, /\b(?:technologies? (?:i use|i have worked with)|i built .{0,80}? using)\s+([^.!?\n]{3,220})/gi, "technology", "Technology", "technologies"),
      ...this.extractSingle(input.content, /\b(?:i built a project called|my project is called|i created a project named)\s+([A-Z][^.!?\n]{1,120})/g, "project", "Project", "projects"),
      ...this.extractSingle(input.content, /\b(?:i won|i completed|i started)\s+([^.!?\n]{3,140})/gi, "timeline_event", "Timeline event", "timeline"),
    ];

    const unique = new Map<string, FactMatch>();
    for (const match of matches) {
      const value = normalizeValue(match.value);
      if (!value) continue;
      const key = `${match.factKey}:${value.toLocaleLowerCase()}`;
      if (!unique.has(key)) unique.set(key, { ...match, value });
    }

    return [...unique.values()].map((match) => ({
      id: factId(match.factKey, match.value, input.genomeVersion, input.sourceLabel),
      factKey: match.factKey,
      title: match.title,
      value: match.value,
      category: match.category,
      description: "Directly stated in consented evidence.",
      status: "active",
      provenance: {
        source: input.sourceLabel,
        evidence: compactEvidence(match.evidence),
        version: input.genomeVersion,
        timestamp: input.timestamp,
        confidence: 0.96,
      },
    }));
  }

  private extractSingle(content: string, pattern: RegExp, factKey: string, title: string, category: IdentityKnowledgeCategory): FactMatch[] {
    return [...content.matchAll(pattern)].map((match) => ({ factKey, title, category, value: match[1] ?? "", evidence: match[0] }));
  }

  private extractList(content: string, pattern: RegExp, factKey: string, title: string, category: IdentityKnowledgeCategory): FactMatch[] {
    return [...content.matchAll(pattern)].flatMap((match) => splitList(match[1] ?? "").map((value) => ({ factKey, title, category, value, evidence: match[0] })));
  }
}

function splitList(value: string): string[] {
  return value.split(/,|\band\b|\//i).map(normalizeValue).filter((item) => item.length >= 2 && item.length <= 80);
}

function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[,:;\-]+$/g, "").trim();
}

function compactEvidence(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
}

function factId(...parts: string[]): string {
  const input = parts.join("|");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return `fact-${(hash >>> 0).toString(36)}`;
}
