import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { InvestigationHistoryRecord } from "@/features/investigation/types";

export type AnalystFinding = { id: string; title: string; detail: string; evidence: string[]; confidence: number | null };
export type AnalystReport = {
  generatedAt: string;
  executiveSummary: string;
  strengths: AnalystFinding[];
  growthAreas: AnalystFinding[];
  trends: AnalystFinding[];
  communication: AnalystFinding[];
  gaps: AnalystFinding[];
  quality: AnalystFinding[];
  recommendations: Array<{ id: string; title: string; identityEvidence: string[]; generalAdvice: string; unknowns: string[] }>;
  timeline: Array<{ id: string; title: string; detail: string; timestamp?: string }>;
  investigations: { total: number; highRisk: number; latest?: string };
};

const gapDefinitions = [
  ["leadership", "Leadership", "No direct leadership statement or project-role evidence is currently stored."],
  ["research", "Research", "No direct research project, publication, or research-interest evidence is currently stored."],
  ["languages", "Languages", "No direct language-proficiency evidence is currently stored."],
  ["finance", "Finance", "No direct financial-goal or financial-literacy evidence is currently stored."],
  ["health", "Health", "No direct health information is currently stored, and TrustDNA does not infer it."],
] as const;

/** Deterministic, evidence-bounded analysis. It never calls an LLM or infers private traits. */
export function analyzeIdentity(snapshot: GenomeSnapshot, investigations: InvestigationHistoryRecord[]): AnalystReport {
  const facts = snapshot.knowledgeHistory.filter((fact) => fact.status === "active");
  const byKey = (keys: string[]) => facts.filter((fact) => keys.includes(fact.factKey));
  const evidence = (items: typeof facts) => items.map((item) => `${item.title}: ${item.value}`).slice(0, 4);
  const skills = byKey(["programming_language", "technology", "framework", "skill"]);
  const projects = byKey(["project"]);
  const dreams = byKey(["dream", "goal", "career"]);
  const values = byKey(["value"]);
  const motivations = byKey(["motivation"]);
  const strengths: AnalystFinding[] = [
    skills.length >= 2 ? { id: "technical-breadth", title: "Technical breadth", detail: `${skills.length} directly stated technologies or skills are recorded.`, evidence: evidence(skills), confidence: averageConfidence(skills) } : null,
    projects.length >= 2 ? { id: "project-evidence", title: "Project-building evidence", detail: `${projects.length} distinct projects are recorded in the current Genome.`, evidence: evidence(projects), confidence: averageConfidence(projects) } : null,
    dreams.length >= 2 ? { id: "long-term-orientation", title: "Long-term orientation", detail: "Multiple directly stated goals, dreams, or career directions are recorded.", evidence: evidence(dreams), confidence: averageConfidence(dreams) } : null,
    values.length >= 2 ? { id: "stated-values", title: "Stated values", detail: "Multiple directly stated values are available for evidence-bounded decision support.", evidence: evidence(values), confidence: averageConfidence(values) } : null,
    motivations.length >= 2 ? { id: "stated-motivations", title: "Stated motivations", detail: "Multiple directly stated motivations are available for evidence-bounded decision support.", evidence: evidence(motivations), confidence: averageConfidence(motivations) } : null,
  ].filter((item): item is AnalystFinding => item !== null);
  const missing = (definition: readonly [string, string, string]) => !facts.some((fact) => fact.factKey.includes(definition[0]) || fact.category.includes(definition[0]));
  const gaps = gapDefinitions.filter(missing).map(([id, title, detail]) => ({ id, title: `Evidence gap: ${title}`, detail, evidence: [], confidence: null }));
  const communication = snapshot.features ? [
    { id: "tone", title: "Professional tone", detail: `Measured professional tone is ${Math.round(snapshot.features.professional_tone * 100)}% in consented analyzed text.`, evidence: ["Deterministic communication measurement"], confidence: snapshot.genomeConfidence === undefined ? null : snapshot.genomeConfidence / 100 },
    { id: "length", title: "Response length", detail: `Average measured response length is ${Math.round(snapshot.features.average_response_length)} words.`, evidence: ["Deterministic communication measurement"], confidence: snapshot.genomeConfidence === undefined ? null : snapshot.genomeConfidence / 100 },
    { id: "language", title: "Language evidence", detail: `Preferred language evidence: ${snapshot.features.preferred_language}.`, evidence: ["Deterministic communication measurement"], confidence: snapshot.genomeConfidence === undefined ? null : snapshot.genomeConfidence / 100 },
  ] : [{ id: "communication-gap", title: "Communication evidence unavailable", detail: "Connect a consented text source such as Gmail or Personal Notes to enable measured communication trends.", evidence: [], confidence: null }];
  const trends = [
    { id: "versions", title: "Genome evolution", detail: `${snapshot.versions.length} versioned Genome snapshot${snapshot.versions.length === 1 ? " is" : "s are"} currently available.`, evidence: snapshot.versions.map((version) => version.version).slice(0, 4), confidence: snapshot.genomeConfidence === undefined ? null : snapshot.genomeConfidence / 100 },
    { id: "skill-growth", title: "Skill coverage", detail: `${skills.length} directly stated technical item${skills.length === 1 ? " is" : "s are"} present in the current version.`, evidence: evidence(skills), confidence: averageConfidence(skills) },
    { id: "goal-evolution", title: "Goal and dream history", detail: `${snapshot.knowledgeHistory.filter((fact) => ["dream", "goal", "career"].includes(fact.factKey)).length} current or historical goal-related object${snapshot.knowledgeHistory.filter((fact) => ["dream", "goal", "career"].includes(fact.factKey)).length === 1 ? " is" : "s are"} retained.`, evidence: evidence(dreams), confidence: averageConfidence(dreams) },
  ];
  const quality = [
    { id: "coverage", title: "Evidence coverage", detail: `${facts.length} active direct fact${facts.length === 1 ? " is" : "s are"} available across ${snapshot.sourceCount} analyzed source${snapshot.sourceCount === 1 ? "" : "s"}.`, evidence: snapshot.sources.filter((source) => source.status === "ingested").map((source) => source.label), confidence: snapshot.genomeConfidence === undefined ? null : snapshot.genomeConfidence / 100 },
    { id: "history", title: "Versioned provenance", detail: `${snapshot.knowledgeHistory.filter((fact) => fact.status === "superseded").length} historical revision${snapshot.knowledgeHistory.filter((fact) => fact.status === "superseded").length === 1 ? " is" : "s are"} retained rather than discarded.`, evidence: ["Structured Identity Knowledge repository"], confidence: 1 },
  ];
  const highRisk = investigations.filter((record) => /high|impersonation|suspicious/i.test(record.result.investigation.verdict)).length;
  const executiveSummary = strengths.length
    ? `Your Identity Genome has direct evidence for ${strengths.map((item) => item.title.toLowerCase()).join(", ")}. This summary is bounded to the ${facts.length} active structured fact${facts.length === 1 ? "" : "s"} currently stored.`
    : `Your Identity Genome currently contains ${facts.length} active structured fact${facts.length === 1 ? "" : "s"}. More consented direct evidence is needed before the Analyst can identify recurring strengths.`;
  return {
    generatedAt: new Date().toISOString(), executiveSummary, strengths, growthAreas: gaps, trends, communication, gaps, quality,
    recommendations: [
      { id: "evidence-next", title: "Build the next evidence layer", identityEvidence: evidence([...skills, ...projects, ...dreams]), generalAdvice: "Add only consented, explicit notes or supported sources for the dimension you want to make more explainable.", unknowns: gaps.slice(0, 3).map((gap) => gap.title.replace("Evidence gap: ", "")) },
      { id: "review-history", title: "Review identity changes", identityEvidence: snapshot.timeline.slice(0, 3).map((event) => event.title), generalAdvice: "Review new and superseded facts after each source update so your active Identity Genome remains accurate.", unknowns: ["Whether the available sources fully represent your current identity"] },
    ],
    timeline: [...snapshot.timeline.map((event) => ({ id: event.id, title: event.title, detail: event.detail, timestamp: event.timestamp })), ...facts.map((fact) => ({ id: fact.id, title: `${fact.title} recorded`, detail: fact.value, timestamp: fact.provenance.timestamp }))].sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? "")).slice(0, 10),
    investigations: { total: investigations.length, highRisk, latest: investigations[0]?.createdAt },
  };
}

function averageConfidence(facts: Array<{ provenance: { confidence: number } }>): number | null { return facts.length ? facts.reduce((total, fact) => total + fact.provenance.confidence, 0) / facts.length : null; }
