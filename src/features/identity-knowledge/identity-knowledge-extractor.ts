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

export type ExtractionDetection = {
  category: string;
  factKey: string;
  value: string;
  objectId?: string;
  stored?: boolean;
  disposition: "extracted" | "discarded" | "already_stored";
  reason?: string;
};

export type SentenceExtractionReport = {
  sentence: string;
  extractor: "IdentityKnowledgeExtractor";
  detections: ExtractionDetection[];
  discardedReason?: string;
};

export type ExtractionRun = {
  facts: IdentityKnowledgeObject[];
  report: SentenceExtractionReport[];
};

const languages = new Set([
  "assembly", "bash", "c", "c++", "c#", "css", "dart", "go", "html", "java", "javascript", "kotlin", "matlab", "php", "python", "r", "ruby", "rust", "scala", "sql", "swift", "typescript",
]);
const frameworks = new Set([
  "angular", "django", "fastapi", "flask", "laravel", "next.js", "nextjs", "node.js", "nodejs", "react", "react native", "spring", "tailwind", "vue", "vue.js",
]);

/**
 * Extracts explicit, sentence-level facts from consented text. The audit API
 * exposes every accepted or rejected sentence without storing raw notes.
 */
export class IdentityKnowledgeExtractor {
  extract(input: KnowledgeExtractionInput): IdentityKnowledgeObject[] {
    return this.extractWithReport(input).facts;
  }

  extractWithReport(input: KnowledgeExtractionInput): ExtractionRun {
    const seen = new Map<string, FactMatch>();
    const report = splitSentences(input.content).map((sentence) => {
      const result = this.extractSentence(sentence);
      const detections: ExtractionDetection[] = [];

      result.matches.forEach((match) => {
        const value = normalizeValue(match.value);
        if (!value) {
          detections.push({ category: match.title, factKey: match.factKey, value: "", disposition: "discarded", reason: "The matched value was empty after normalization." });
          return;
        }
        const key = `${match.factKey}:${value.toLocaleLowerCase()}`;
        if (!seen.has(key)) seen.set(key, { ...match, value });
        detections.push({ category: match.title, factKey: match.factKey, value, disposition: "extracted" });
      });

      result.discarded.forEach((reason) => detections.push({ category: "Unsupported technical value", factKey: "technical", value: "", disposition: "discarded", reason }));
      return {
        sentence,
        extractor: "IdentityKnowledgeExtractor" as const,
        detections,
        discardedReason: detections.length ? undefined : "No supported explicit-statement pattern matched this sentence.",
      };
    });

    const facts = [...seen.values()].map((match) => toKnowledgeObject(match, input));
    const factByKey = new Map(facts.map((fact) => [`${fact.factKey}:${fact.value.toLocaleLowerCase()}`, fact]));
    report.forEach((entry) => entry.detections.forEach((detection) => {
      const object = factByKey.get(`${detection.factKey}:${detection.value.toLocaleLowerCase()}`);
      if (object) detection.objectId = object.id;
    }));
    return { facts, report };
  }

  private extractSentence(sentence: string): { matches: FactMatch[]; discarded: string[] } {
    const matches: FactMatch[] = [];
    const discarded: string[] = [];
    const statementStatus = temporalStatus(sentence);
    const add = (definition: FactDefinition, value: string, status = statementStatus) => matches.push({ ...definition, value, evidence: sentence, status });

    const name = firstMatch(sentence, [/^(?:my name is|name\s*[:\-]|i am|i'm)\s+(.+)$/i]);
    if (name && looksLikeName(name)) add({ factKey: "name", title: "Name", category: "identity" }, name);

    const dateOfBirth = firstMatch(sentence, [/^(?:i was born on|my (?:date of birth|birthday) is|date of birth\s*[:\-])\s+(.+)$/i]);
    if (dateOfBirth) add({ factKey: "date_of_birth", title: "Date of birth", category: "identity" }, dateOfBirth);

    const academic = extractAcademicFacts(sentence);
    if (academic.university) add({ factKey: "university", title: "University", category: "education" }, academic.university);
    if (academic.degree) add({ factKey: "degree", title: "Degree", category: "education" }, academic.degree);
    if (academic.department) add({ factKey: "department", title: "Department", category: "education" }, academic.department);

    const school = firstMatch(sentence, [/^(?:i studied at|my school is|school\s*[:\-])\s+(.+)$/i]);
    if (school) add({ factKey: "school", title: "School", category: "education" }, school);

    const dream = firstMatch(sentence, [
      /^(?:my\s+(?:biggest|greatest|ultimate)\s+dream|my dream|my ambition|my aspiration|dream|ambition|aspiration)\s*(?:is|:)?\s*(.+)$/i,
      /^i\s+(?:dream of|aspire to|hope to)\s+(.+)$/i,
    ]);
    if (dream) add({ factKey: "dream", title: "Dream", category: "goals" }, dream);

    const career = firstMatch(sentence, [
      /^i\s+(?:want|plan|aim|hope|aspire)\s+to\s+(?:become|work as)\s+(.+)$/i,
      /^(?:my\s+)?career\s+(?:goal|direction|ambition)\s*(?:is|:)?\s*(.+)$/i,
    ]);
    if (career) add({ factKey: "career", title: "Career", category: "career" }, career);

    const goal = firstMatch(sentence, [
      /^(?:my\s+)?goals?\s*(?:are|is|:)?\s*(.+)$/i,
      /^i\s+(?:want|plan|aim|intend|hope)\s+to\s+(.+)$/i,
    ]);
    if (goal) add({ factKey: "goal", title: "Goal", category: "goals" }, goal.startsWith("to ") ? goal : `to ${goal}`);

    const values = firstMatch(sentence, [
      /^(?:my\s+)?(?:core\s+)?values?\s*(?:are|is|include|:)?\s*(.+)$/i,
      /^i\s+(?:value|believe in|care about)\s+(.+)$/i,
      /^what matters to me\s*(?:is|:)?\s*(.+)$/i,
    ]);
    if (values) splitList(values).forEach((value) => add({ factKey: "value", title: "Value", category: "values" }, value));

    const motivations = firstMatch(sentence, [
      /^(?:my\s+)?(?:biggest\s+)?motivation\s*(?:is|:)?\s*(.+)$/i,
      /^what motivates me\s*(?:is|:)?\s*(.+)$/i,
      /^i\s+am\s+(?:motivated|driven)\s+by\s+(.+)$/i,
    ]);
    if (motivations) splitList(motivations).forEach((value) => add({ factKey: "motivation", title: "Motivation", category: "motivations" }, value));

    const projectValues = firstMatch(sentence, [
      /^i\s+(?:have\s+)?(?:built|created|developed|made|launched)\s+(.+)$/i,
      /^(?:my\s+)?projects?\s*(?:include|are|:)?\s*(.+)$/i,
    ]);
    if (projectValues) splitList(projectValues).forEach((value) => add({ factKey: "project", title: "Project", category: "projects" }, value));

    const favoriteSport = firstMatch(sentence, [/^my favou?rite sport(?: is|:)?\s+(.+)$/i]);
    if (favoriteSport) add({ factKey: "sport", title: "Favorite sport", category: "sports" }, favoriteSport);
    const playedSport = firstMatch(sentence, [/^i\s+(?:play|enjoy playing)\s+(.+)$/i]);
    if (playedSport) add({ factKey: "sport", title: "Sport", category: "sports" }, playedSport);

    const favoritePlayer = sentence.match(/^(?:(now|currently|current|latest|previously|earlier|before|formerly|used to)\s+)?my favou?rite (?:player|cricketer)\s+(was|is|:)?\s*(.+)$/i);
    if (favoritePlayer?.[3]) {
      const marker = favoritePlayer[1]?.toLocaleLowerCase();
      const historical = favoritePlayer[2]?.toLocaleLowerCase() === "was" || ["previously", "earlier", "before", "formerly", "used to"].includes(marker ?? "");
      add({ factKey: "favorite_player", title: "Favorite cricketer", category: "sports" }, favoritePlayer[3], historical ? "superseded" : "active");
    }

    const interest = firstMatch(sentence, [/^i\s+(?:enjoy|like|love|am interested in)\s+(.+)$/i, /^(?:my\s+)?interests?\s*(?:include|are|:)?\s*(.+)$/i]);
    if (interest) splitList(interest).forEach((value) => add({ factKey: "interest", title: "Interest", category: "interests" }, value));

    const technical = firstMatch(sentence, [
      /^i\s+(?:know|use|code in|work with|am proficient in|have experience with)\s+(.+)$/i,
      /^(?:my\s+)?(?:technical\s+)?(?:skills|programming languages?|frameworks?|technologies|tech stack)\s*(?:include|are|:)?\s*(.+)$/i,
    ]);
    if (technical) {
      const technicalMatches = extractTechnicalFacts(technical, sentence);
      matches.push(...technicalMatches.matches);
      discarded.push(...technicalMatches.discarded);
    }

    return { matches, discarded };
  }
}

/** Marks each extracted object as stored, already present, or rejected after merging. */
export function finalizeExtractionReport(run: ExtractionRun, storedObjects: IdentityKnowledgeObject[]): SentenceExtractionReport[] {
  return run.report.map((entry) => ({
    ...entry,
    detections: entry.detections.map((detection) => {
      if (detection.disposition === "discarded") return detection;
      const matching = storedObjects.find((object) => object.factKey === detection.factKey && sameValue(object.value, detection.value));
      if (!matching) return { ...detection, stored: false, disposition: "discarded", reason: "The extracted object was not present after the merge." };
      if (matching.id !== detection.objectId) return { ...detection, stored: true, disposition: "already_stored", reason: "An identical knowledge object was already present in the repository." };
      return { ...detection, stored: true, disposition: "extracted" };
    }),
  }));
}

/** Emits a structured, transient browser-console report. Raw note text is never persisted. */
export function logExtractionReport(report: SentenceExtractionReport[], sourceLabel: string): void {
  if (typeof window === "undefined") return;
  console.groupCollapsed(`[TrustDNA] Extraction report - ${sourceLabel}`);
  report.forEach((entry) => console.info("[TrustDNA][extraction]", {
    sentence: entry.sentence,
    extractor: entry.extractor,
    detections: entry.detections,
    discardedReason: entry.discardedReason,
  }));
  console.groupEnd();
}

function toKnowledgeObject(match: FactMatch, input: KnowledgeExtractionInput): IdentityKnowledgeObject {
  return {
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
      confidence: .96,
    },
  };
}

function splitSentences(content: string): string[] {
  return content
    .replace(/\r\n?/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/^[-*•]\s*/, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean);
}

function firstMatch(sentence: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match?.[1]) return normalizeValue(match[1]);
  }
  return undefined;
}

function extractAcademicFacts(sentence: string): { university?: string; degree?: string; department?: string } {
  const directUniversity = firstMatch(sentence, [/^(?:i study at|i am studying at|currently studying at|current university is|my university is|i attend|university\s*[:\-])\s+(.+)$/i]);
  const academicAt = sentence.match(/^(?:i\s+(?:am\s+)?(?:studying|pursuing)|i\s+(?:completed|graduated(?:\s+with)?|earned|received))\s+(.+?)\s+(?:at|from)\s+(.+)$/i);
  const directDegree = firstMatch(sentence, [/^(?:my\s+)?degree\s*(?:is|:)?\s*(.+)$/i]);
  const directDepartment = firstMatch(sentence, [/^(?:my\s+)?department\s*(?:is|:)?\s*(.+)$/i, /^i study in the department of\s+(.+)$/i]);
  const program = directDegree ?? academicAt?.[1];
  const parsed = program ? parseAcademicProgram(program) : {};
  return {
    university: cleanInstitution(directUniversity ?? academicAt?.[2]),
    degree: parsed.degree,
    department: directDepartment ?? parsed.department,
  };
}

function extractTechnicalFacts(value: string, evidence: string): { matches: FactMatch[]; discarded: string[] } {
  const matches: FactMatch[] = [];
  const discarded: string[] = [];
  splitList(value).forEach((item) => {
    const normalized = item.toLocaleLowerCase();
    if (languages.has(normalized)) matches.push({ factKey: "programming_language", title: "Programming language", value: item, category: "skills", evidence });
    else if (frameworks.has(normalized)) matches.push({ factKey: "framework", title: "Framework", value: item, category: "skills", evidence });
    else discarded.push(`"${item}" is not in the supported deterministic language/framework registry.`);
  });
  return { matches, discarded };
}

function parseAcademicProgram(value: string): { degree?: string; department?: string } {
  const normalized = normalizeValue(value).replace(/^(?:my|a|an|the)\s+/i, "");
  const [degree, ...departmentParts] = normalized.split(/\s+in\s+/i);
  const department = departmentParts.join(" in ").trim();
  return { degree: degree.trim() || undefined, department: department || undefined };
}

function cleanInstitution(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return normalizeValue(value).replace(/\s+(?:in|during)\s+\d{4}\b.*$/i, "").trim() || undefined;
}

function temporalStatus(sentence: string): KnowledgeFactStatus {
  return /^(?:previously|earlier|before|formerly|used to)\b/i.test(sentence.trim()) ? "superseded" : "active";
}

function splitList(value: string): string[] {
  return value
    .split(/,|;|\band\b|\//i)
    .map(normalizeValue)
    .filter((item) => item.length >= 1 && item.length <= 120);
}

function looksLikeName(value: string): boolean {
  return !/\b(?:a|an|the|studying|pursuing|working|student|developer|founder)\b/i.test(value);
}

function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[,:;\-]+$/g, "").trim();
}

function compactEvidence(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
}

function sameValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}

function factId(...parts: string[]): string {
  const input = parts.join("|");
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return `fact-${(hash >>> 0).toString(36)}`;
}
