import type { IdentityKnowledgeCategory, IdentityKnowledgeObject, KnowledgeExtractionInput, KnowledgeFactStatus } from "@/features/identity-knowledge/types";
import { createKnowledgeObjectId, isHumanName } from "@/features/identity-knowledge/knowledge-integrity";

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
  "angular", "django", "express", "express.js", "fastapi", "flask", "laravel", "next.js", "nextjs", "node.js", "nodejs", "react", "react native", "spring", "tailwind", "vue", "vue.js",
]);
const tools = new Set([
  "aws", "docker", "firebase", "git", "kubernetes", "linux", "mongodb", "postgresql",
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

    const explicitName = firstMatch(sentence, [/^(?:my name is|name\s*[:\-])\s+(.+)$/i]);
    if (explicitName && isHumanName(explicitName)) add({ factKey: "name", title: "Name", category: "identity" }, explicitName);
    else if (explicitName) discarded.push("The explicit Name value is not a valid human name.");
    const firstPersonName = firstMatch(sentence, [/^(?:i am|i'm)\s+(.+)$/i]);
    if (firstPersonName && isHumanName(firstPersonName)) add({ factKey: "name", title: "Name", category: "identity" }, firstPersonName);
    else if (firstPersonName) discarded.push("An \"I am\" statement was not stored as Name because it is not a valid human name.");

    const dateOfBirth = firstMatch(sentence, [/^(?:i was born on|my (?:date of birth|birthday) is|date of birth\s*[:\-])\s+(.+)$/i]);
    if (dateOfBirth) add({ factKey: "date_of_birth", title: "Date of birth", category: "identity" }, dateOfBirth);

    const academic = extractAcademicFacts(sentence);
    if (academic.university) add({ factKey: "university", title: "University", category: "education" }, academic.university);
    if (academic.degree) add({ factKey: "degree", title: "Degree", category: "education" }, academic.degree);
    if (academic.branch) add({ factKey: "branch", title: "Branch", category: "education" }, academic.branch);
    if (academic.startYear) add({ factKey: "education_start_year", title: "Start year", category: "education" }, academic.startYear);
    if (academic.endYear) add({ factKey: "education_end_year", title: "End year", category: "education" }, academic.endYear);
    if (academic.status) add({ factKey: "education_status", title: "Education status", category: "education" }, academic.status);

    const school = firstMatch(sentence, [/^(?:i studied at|my school is|school\s*[:\-])\s+(.+)$/i]);
    if (school) add({ factKey: "school", title: "School", category: "education" }, school);

    const dream = firstMatch(sentence, [
      /^(?:(?:my\s+(?:(?:biggest|greatest|ultimate|long[-\s]term)\s+)?dream)|my\s+(?:ambition|aspiration|mission)|dream|ambition|aspiration|mission)\s*(?:is|:)?\s*(.+)$/i,
      /^i\s+(?:dream of|aspire to|hope to)\s+(.+)$/i,
    ]);
    if (dream) add({ factKey: "dream", title: "Dream", category: "goals" }, dream);

    const career = firstMatch(sentence, [
      /^i\s+(?:want|plan|aim|hope|aspire)\s+to\s+(?:become|work as)\s+(.+)$/i,
      /^(?:my\s+)?career\s+(?:goal|direction|ambition)\s*(?:is|:)?\s*(.+)$/i,
    ]);
    if (career) add({ factKey: "career", title: "Career", category: "career" }, career);

    const goal = firstMatch(sentence, [
      /^(?:my\s+(?:long[-\s]term\s+)?)?goals?\s*(?:are|is|:)?\s*(.+)$/i,
      /^i\s+(?:want|plan|aim|intend|hope)\s+to\s+(.+)$/i,
    ]);
    if (goal) add({ factKey: "goal", title: "Goal", category: "goals" }, goal.startsWith("to ") ? goal : `to ${goal}`);

    const values = firstMatch(sentence, [
      /^(?:my\s+)?(?:core\s+)?values?\s*(?:are|is|include|:)?\s*(.+)$/i,
      /^i\s+(?:value|believe in|care about)\s+(.+)$/i,
      /^(?:my\s+)?principles?\s*(?:are|is|include|:)?\s*(.+)$/i,
      /^what matters to me\s*(?:is|:)?\s*(.+)$/i,
    ]);
    if (values) splitList(values).forEach((value) => add({ factKey: "value", title: "Value", category: "values" }, value));

    const motivations = firstMatch(sentence, [
      /^(?:my\s+)?(?:biggest\s+)?motivations?(?:\s+(?:is|are)|\s*:\s*)(.+)$/i,
      /^what motivates me(?:\s+(?:is|are)|\s*:\s*)(.+)$/i,
      /^i\s+am\s+(?:motivated|driven)\s+by\s+(.+)$/i,
      /^i\s+want\s+to\s+((?:help|improve)\b.+)$/i,
    ]);
    if (motivations) splitList(motivations).forEach((value) => add({ factKey: "motivation", title: "Motivation", category: "motivations" }, value));

    const projectValues = firstMatch(sentence, [
      /^i\s+(?:have\s+)?(?:built|created|developed|made|launched|designed)\s+(.+)$/i,
      /^(?:my\s+)?projects?\s*(?:include|are|:)?\s*(.+)$/i,
    ]);
    if (projectValues) splitList(projectValues).map(normalizeProjectValue).filter(Boolean).forEach((value) => add({ factKey: "project", title: "Project", category: "projects" }, value));

    const favoriteSport = firstMatch(sentence, [/^my favou?rite sport(?: is|:)?\s+(.+)$/i]);
    if (favoriteSport) add({ factKey: "sport", title: "Favorite sport", category: "sports" }, favoriteSport);
    const playedSport = firstMatch(sentence, [/^i\s+(?:play|enjoy playing)\s+(.+)$/i]);
    if (playedSport) add({ factKey: "sport", title: "Sport", category: "sports" }, playedSport);

    const favoritePlayer = sentence.match(/^(?:(now|currently|current|latest|previously|earlier|before|formerly|used to)\s+)?my\s+(?:(now|currently|current|latest|previously|earlier|before|formerly|used to)\s+)?favou?rite (?:player|cricketer)\s+(was|is|:)?\s*(.+)$/i);
    if (favoritePlayer?.[4]) {
      const marker = (favoritePlayer[1] ?? favoritePlayer[2])?.toLocaleLowerCase();
      const historical = favoritePlayer[3]?.toLocaleLowerCase() === "was" || ["previously", "earlier", "before", "formerly", "used to"].includes(marker ?? "");
      add({ factKey: "favorite_player", title: "Favorite cricketer", category: "sports" }, favoritePlayer[4], historical ? "superseded" : "active");
    }

    const books = firstMatch(sentence, [/^i\s+(?:enjoy|like|love)\s+reading\s+(.+)$/i]);
    if (books) {
      add({ factKey: "interest", title: "Interest", category: "interests" }, "reading");
      splitList(books).forEach((value) => add({ factKey: "book", title: "Book", category: "interests" }, value));
    } else {
      const interest = firstMatch(sentence, [/^i\s+(?:enjoy|like|love|am interested in)\s+(.+)$/i, /^(?:my\s+)?interests?\s*(?:include|are|:)?\s*(.+)$/i]);
      if (interest) splitList(interest).forEach((value) => add({ factKey: "interest", title: "Interest", category: "interests" }, value));
    }

    const technical = firstMatch(sentence, [
      /^i\s+(?:know|(?:regularly\s+)?use|code in|work with|am proficient in|have experience (?:in|with))\s+(.+)$/i,
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
    id: createKnowledgeObjectId(),
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

type AcademicFacts = {
  university?: string;
  degree?: string;
  branch?: string;
  startYear?: string;
  endYear?: string;
  status?: string;
};

/**
 * Supports explicit first-person statements and the compact, label-free rows
 * commonly found in resumes and consented email signatures. Every returned
 * field is present in the source sentence; no academic field is inferred.
 */
function extractAcademicFacts(sentence: string): AcademicFacts {
  const directUniversity = firstMatch(sentence, [
    /^(?:i study at|i am studying at|currently studying at|current university is|my university is|i attend|i am enrolled at|university\s*[:\-]|college\s*[:\-]|institution\s*[:\-])\s+(.+)$/i,
  ]);
  const academicAt = sentence.match(/^(?:(?:i\s+)?(?:am\s+)?(?:currently\s+)?(?:studying|pursuing|enrolled\s+in)|(?:i\s+)?(?:completed|graduated(?:\s+with)?|earned|received))\s+(.+?)\s+(?:at|from)\s+(.+)$/i);
  const directDegree = firstMatch(sentence, [/^(?:my\s+)?degree\s*(?:is|:)?\s*(.+)$/i]);
  const directBranch = firstMatch(sentence, [
    /^(?:my\s+)?(?:branch|department|major|speciali[sz]ation)\s*(?:is|:)?\s*(.+)$/i,
    /^i study in the (?:branch|department) of\s+(.+)$/i,
  ]);
  const program = directDegree ?? academicAt?.[1] ?? sentence;
  const parsed = parseAcademicProgram(program);
  const years = extractAcademicYears(sentence);

  return {
    university: cleanInstitution(directUniversity ?? academicAt?.[2] ?? findInstitution(sentence)),
    degree: parsed.degree,
    branch: directBranch ?? parsed.branch,
    startYear: years.startYear,
    endYear: years.endYear,
    status: extractAcademicStatus(sentence, years),
  };
}

function extractTechnicalFacts(value: string, evidence: string): { matches: FactMatch[]; discarded: string[] } {
  const matches: FactMatch[] = [];
  const discarded: string[] = [];
  splitList(value).forEach((item) => {
    const normalized = item.toLocaleLowerCase();
    if (languages.has(normalized)) matches.push({ factKey: "programming_language", title: "Programming language", value: item, category: "skills", evidence });
    else if (frameworks.has(normalized)) matches.push({ factKey: "framework", title: "Framework", value: item, category: "skills", evidence });
    else if (tools.has(normalized)) matches.push({ factKey: "technology", title: "Technology", value: item, category: "technologies", evidence });
    else discarded.push(`"${item}" is not in the supported deterministic language/framework registry.`);
  });
  return { matches, discarded };
}

function parseAcademicProgram(value: string): { degree?: string; branch?: string } {
  const normalized = normalizeValue(value).replace(/^(?:my|a|an|the)\s+/i, "");
  const degree = findDegree(normalized);
  if (!degree) return {};

  const degreeIndex = normalized.toLocaleLowerCase().indexOf(degree.toLocaleLowerCase());
  const afterDegree = degreeIndex === -1 ? "" : normalized.slice(degreeIndex + degree.length);
  const branchMatch = afterDegree.match(/^\s*(?:\([^)]*\)\s*)?(?:in|[-â€“â€”|,:])\s+(.+)$/i);
  return {
    degree,
    branch: branchMatch ? cleanAcademicValue(branchMatch[1]) : undefined,
  };
}

function findDegree(value: string): string | undefined {
  const match = value.match(/\b((?:b\.?\s*tech(?:nology)?|m\.?\s*tech(?:nology)?|b\.?\s*e\.?|m\.?\s*e\.?|b\.?\s*sc(?:ience)?|m\.?\s*sc(?:ience)?|bca|mca|bba|mba|ph\.?\s*d\.?|diploma)|(?:bachelor(?:'s)?|master(?:'s)?)(?:\s+of\s+(?:technology|science|arts|engineering|business(?:\s+administration)?|computer\s+applications?|commerce|design))?)\b/i);
  return match?.[1] ? normalizeValue(match[1]) : undefined;
}

function findInstitution(sentence: string): string | undefined {
  const anchored = sentence.match(/\b(?:at|from)\s+([A-Z][\p{L}\d&.'()\-]*(?:\s+(?:[A-Z][\p{L}\d&.'()\-]*|of|and|for|the)){0,8}\s+(?:University|College|Institute|Polytechnic|Academy)(?:\s+(?:[A-Z][\p{L}\d&.'()\-]*|of|and|for|the)){0,5})/iu);
  if (anchored?.[1]) return cleanInstitution(anchored[1]);

  const abbreviated = sentence.match(/\b(?:at|from)\s+((?:IIIT|IIT|NIT|IIM|BITS|AIIMS)(?:\s+[A-Z][\p{L}\d&.'()\-]*){0,5})/iu);
  if (abbreviated?.[1]) return cleanInstitution(abbreviated[1]);

  const standalone = [...sentence.matchAll(/\b([A-Z][\p{L}\d&.'()\-]*(?:\s+(?:[A-Z][\p{L}\d&.'()\-]*|of|and|for|the)){0,8}\s+(?:University|College|Institute|Polytechnic|Academy)(?:\s+(?:[A-Z][\p{L}\d&.'()\-]*|of|and|for|the)){0,5})/giu)];
  if (standalone.at(-1)?.[1]) return cleanInstitution(standalone.at(-1)?.[1]);

  const abbreviatedStandalone = [...sentence.matchAll(/\b((?:IIIT|IIT|NIT|IIM|BITS|AIIMS)(?:\s+[A-Z][\p{L}\d&.'()\-]*){0,5})/giu)];
  return cleanInstitution(abbreviatedStandalone.at(-1)?.[1]);
}

function extractAcademicYears(sentence: string): { startYear?: string; endYear?: string } {
  const range = sentence.match(/\b((?:19|20)\d{2})\s*(?:[-â€“â€”]|to)\s*((?:19|20)\d{2}|present|current|ongoing)\b/i);
  if (range) {
    return {
      startYear: range[1],
      endYear: /^(?:19|20)\d{2}$/i.test(range[2]) ? range[2] : undefined,
    };
  }

  const startYear = sentence.match(/\b(?:from|started|start(?:\s+year)?|joined|enrolled(?:\s+in)?)\s*(?:in\s*)?((?:19|20)\d{2})\b/i)?.[1];
  const endYear = sentence.match(/\b(?:expected(?:\s+graduation)?|graduating|graduated|completed|ended|end(?:\s+year)?|until|to)\s*(?:in\s*)?((?:19|20)\d{2})\b/i)?.[1];
  return { startYear, endYear };
}

function extractAcademicStatus(sentence: string, years: { startYear?: string; endYear?: string }): string | undefined {
  if (/\b(?:graduated|completed|earned|received|alumn(?:us|a|i)|former)\b/i.test(sentence)) return "Completed";
  if (/\b(?:pursuing|studying|enrolled|attending|currently|current|ongoing|in\s+progress|present|expected)\b/i.test(sentence)) return "In progress";
  return years.endYear && /\b(?:graduated|completed)\b/i.test(sentence) ? "Completed" : undefined;
}

function cleanAcademicValue(value: string): string | undefined {
  const normalized = normalizeValue(value)
    .replace(/\s+(?:at|from)\s+.+$/i, "")
    .replace(/\s*(?:,|\|)\s*.+?\b(?:University|College|Institute|Polytechnic|Academy)\b.*$/i, "")
    .replace(/\s*(?:\||,)?\s*(?:\(?\s*(?:19|20)\d{2}\s*(?:[-â€“â€”]|to)\s*(?:(?:19|20)\d{2}|present|current|ongoing)?\s*\)?)\s*$/i, "")
    .trim();
  return normalized || undefined;
}

function cleanInstitution(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return normalizeValue(value)
    .replace(/\s+(?:from|in|during)\s+(?:19|20)\d{2}(?:\s*(?:to|[-\u2013\u2014])\s*(?:(?:19|20)\d{2}|present|current|ongoing))?\b.*$/i, "")
    // The label-free institution matcher stops before a following year, so it
    // can leave the connecting word behind (for example, "University in").
    .replace(/\s+(?:from|in|during)$/i, "")
    .trim() || undefined;
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

function normalizeProjectValue(value: string): string {
  return normalizeValue(value)
    .replace(/^(?:(?:a|an|the)\s+)?(?:project|app|application|platform)\s+(?:called|named)\s+/i, "")
    .replace(/^projects?\s+(?:called|named)\s+/i, "")
    .trim();
}

function normalizeValue(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^[\s'"“”]+|[\s,;:!?…'"“”]+$/gu, "").trim();
}

function compactEvidence(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
}

function sameValue(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
}
