import type { IdentityKnowledgeCategory, IdentityKnowledgeObject, KnowledgeExtractionInput, KnowledgeFactStatus } from "@/features/identity-knowledge/types";

type FactMatch = {
  factKey: string;
  title: string;
  value: string;
  category: IdentityKnowledgeCategory;
  evidence: string;
  status?: KnowledgeFactStatus;
};

type FactDefinition = Pick<FactMatch, "factKey" | "title" | "category">;

const languages = new Set([
  "c", "c++", "c#", "dart", "go", "java", "javascript", "kotlin", "php", "python", "r", "ruby", "rust", "swift", "typescript",
]);
const frameworks = new Set([
  "angular", "django", "fastapi", "flask", "laravel", "next.js", "nextjs", "node.js", "nodejs", "react", "react native", "spring", "tailwind", "vue", "vue.js",
]);

/**
 * Extracts only explicit, sentence-level statements from consented text.
 * It never promotes vocabulary frequency or an ambiguous phrase into an
 * Identity Fact, and it never uses a generative model.
 */
export class IdentityKnowledgeExtractor {
  extract(input: KnowledgeExtractionInput): IdentityKnowledgeObject[] {
    const matches = splitSentences(input.content).flatMap((sentence) => this.extractSentence(sentence));
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
      status: match.status ?? "active",
      provenance: {
        source: input.sourceLabel,
        evidence: compactEvidence(match.evidence),
        version: input.genomeVersion,
        timestamp: input.timestamp,
        confidence: 0.96,
      },
    }));
  }

  private extractSentence(sentence: string): FactMatch[] {
    const facts: FactMatch[] = [];
    const statementStatus = temporalStatus(sentence);
    const add = (definition: FactDefinition, value: string, status = statementStatus) => facts.push({ ...definition, value, evidence: sentence, status });

    const name = matchValue(sentence, /^(?:my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})$/i);
    if (name && looksLikeName(name)) add({ factKey: "name", title: "Name", category: "identity" }, name);

    const dateOfBirth = matchValue(sentence, /^(?:i was born on|my (?:date of birth|birthday) is)\s+(.+)$/i);
    if (dateOfBirth) add({ factKey: "date_of_birth", title: "Date of birth", category: "identity" }, dateOfBirth);

    const directUniversity = matchValue(sentence, /^(?:i study at|i am studying at|currently studying at|current university is|my university is|i attend)\s+(.+)$/i);
    const academicAt = sentence.match(/^(?:i study|i am studying|i am pursuing)\s+(.+?)\s+at\s+(.+)$/i);
    const university = directUniversity ?? (academicAt?.[2] ? normalizeValue(academicAt[2]) : undefined);
    if (university) add({ factKey: "university", title: "University", category: "education" }, university);

    const academicProgram = academicAt?.[1] ? normalizeValue(academicAt[1]) : undefined;
    const degree = academicProgram ?? (directUniversity ? undefined : matchValue(sentence, /^(?:i am pursuing|my degree is|i study)\s+(.+)$/i));
    if (degree && !/^my degree$/i.test(degree)) {
      const program = parseAcademicProgram(degree);
      add({ factKey: "degree", title: "Degree", category: "education" }, program.degree);
      if (program.department) add({ factKey: "department", title: "Department", category: "education" }, program.department);
    }

    const explicitDepartment = matchValue(sentence, /^(?:my department is|i study in the department of)\s+(.+)$/i);
    if (explicitDepartment) add({ factKey: "department", title: "Department", category: "education" }, explicitDepartment);

    const school = matchValue(sentence, /^(?:i studied at|my school is)\s+(.+)$/i);
    if (school) add({ factKey: "school", title: "School", category: "education" }, school);

    const dream = matchValue(sentence, /^my dream is\s+(.+)$/i);
    if (dream) add({ factKey: "dream", title: "Dream", category: "goals" }, dream);

    const explicitGoal = matchValue(sentence, /^(?:my goal is|my goals are)\s+(.+)$/i);
    if (explicitGoal) add({ factKey: "goal", title: "Goal", category: "goals" }, explicitGoal);

    const wantsTo = matchValue(sentence, /^i want to\s+(.+)$/i);
    if (wantsTo) add({ factKey: "goal", title: "Goal", category: "goals" }, `to ${wantsTo}`);

    const career = matchValue(sentence, /^i want to (?:become|work as)\s+(.+)$/i);
    if (career) add({ factKey: "career", title: "Career", category: "career" }, career);

    const project = matchValue(sentence, /^i (?:built|created|developed|made)\s+(.+)$/i);
    if (project) add({ factKey: "project", title: "Project", category: "projects" }, project);

    const favoriteSport = matchValue(sentence, /^my favou?rite sport(?: is)?\s+(.+)$/i);
    if (favoriteSport) add({ factKey: "sport", title: "Favorite sport", category: "sports" }, favoriteSport);

    const playedSport = matchValue(sentence, /^i play\s+(.+)$/i);
    if (playedSport) add({ factKey: "sport", title: "Sport", category: "sports" }, playedSport);

    const favoritePlayerMatch = sentence.match(/^(?:(now|currently|current|latest|previously|earlier|before|formerly|used to)\s+)?my favou?rite (?:player|cricketer)\s+(was|is)\s+(.+)$/i);
    if (favoritePlayerMatch?.[3]) {
      const verb = favoritePlayerMatch[2].toLocaleLowerCase();
      const marker = favoritePlayerMatch[1]?.toLocaleLowerCase();
      const historical = verb === "was" || ["previously", "earlier", "before", "formerly", "used to"].includes(marker ?? "");
      add({ factKey: "favorite_player", title: "Favorite cricketer", category: "sports" }, favoritePlayerMatch[3], historical ? "superseded" : "active");
    }

    const interest = matchValue(sentence, /^i (?:enjoy|like|am interested in)\s+(.+)$/i);
    if (interest) add({ factKey: "interest", title: "Interest", category: "interests" }, interest);

    const technicalStatement = matchValue(sentence, /^i (?:know|use|code in|work with)\s+(.+)$/i);
    if (technicalStatement) facts.push(...extractTechnicalFacts(technicalStatement, sentence));

    return facts;
  }
}

function splitSentences(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/^[-*•]\s*/, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
}

function matchValue(sentence: string, pattern: RegExp): string | undefined {
  const match = sentence.match(pattern);
  return match?.[1] ? normalizeValue(match[1]) : undefined;
}

function extractTechnicalFacts(value: string, evidence: string): FactMatch[] {
  return splitList(value).flatMap((item) => {
    const normalized = item.toLocaleLowerCase();
    if (languages.has(normalized)) return [{ factKey: "programming_language", title: "Programming language", value: item, category: "skills" as const, evidence }];
    if (frameworks.has(normalized)) return [{ factKey: "framework", title: "Framework", value: item, category: "skills" as const, evidence }];
    return [];
  });
}

function parseAcademicProgram(value: string): { degree: string; department?: string } {
  const normalized = normalizeValue(value).replace(/^(?:a|an|the)\s+/i, "");
  const [degree, ...departmentParts] = normalized.split(/\s+in\s+/i);
  const department = departmentParts.join(" in ").trim();
  return { degree: degree.trim(), department: department || undefined };
}

function temporalStatus(sentence: string): KnowledgeFactStatus {
  return /^(?:previously|earlier|before|formerly|used to)\b/i.test(sentence.trim()) ? "superseded" : "active";
}

function splitList(value: string): string[] {
  return value
    .split(/,|\band\b|\//i)
    .map(normalizeValue)
    .filter((item) => item.length >= 1 && item.length <= 80);
}

function looksLikeName(value: string): boolean {
  return !/\b(?:a|an|the|studying|pursuing|working|student|developer)\b/i.test(value);
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
