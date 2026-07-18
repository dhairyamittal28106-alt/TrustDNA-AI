import { IdentityScoringEngine } from "@/features/identity-reasoning/identity-scoring-engine";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { BehaviorPattern, IdentityDimension } from "@/features/identity-reasoning/types";

type SignalDefinition = {
  id: string;
  label: string;
  detail: (count: number) => string;
  matches: (fact: IdentityKnowledgeObject) => boolean;
};

const repeatedSignals: SignalDefinition[] = [
  {
    id: "repeated-product-building",
    label: "Repeated product-building evidence",
    detail: (count) => `${count} direct project statements are recorded in the current Identity Genome.`,
    matches: (fact) => fact.factKey === "project",
  },
  {
    id: "repeated-entrepreneurship-direction",
    label: "Repeated entrepreneurship-direction evidence",
    detail: (count) => `${count} direct statements reference entrepreneurship, startup, founder, or ownership direction.`,
    matches: (fact) => /\b(entrepreneur|startup|start-up|founder|ownership)\b/i.test(`${fact.value} ${fact.provenance.evidence}`),
  },
  {
    id: "repeated-learning-priority",
    label: "Repeated learning-priority evidence",
    detail: (count) => `${count} direct statements explicitly reference learning, study, or knowledge.`,
    matches: (fact) => /\b(learn|learning|study|studies|knowledge)\b/i.test(`${fact.value} ${fact.provenance.evidence}`),
  },
  {
    id: "repeated-ownership-preference",
    label: "Repeated ownership-preference evidence",
    detail: (count) => `${count} direct statements explicitly reference ownership, founding, or building a startup.`,
    matches: (fact) => /\b(ownership|own(?:er|ership)?|founder|startup|start-up)\b/i.test(`${fact.value} ${fact.provenance.evidence}`),
  },
  {
    id: "repeated-analytical-decision-evidence",
    label: "Repeated evidence-based decision language",
    detail: (count) => `${count} direct statements explicitly reference evidence, data, analysis, or reasoning.`,
    matches: (fact) => /\b(evidence|data|analysis|analytical|reasoning)\b/i.test(`${fact.value} ${fact.provenance.evidence}`),
  },
  {
    id: "repeated-risk-language",
    label: "Repeated risk-preference language",
    detail: (count) => `${count} direct statements explicitly reference risk or uncertainty.`,
    matches: (fact) => /\b(risk|uncertainty)\b/i.test(`${fact.value} ${fact.provenance.evidence}`),
  },
];

/** Emits a behavior signal only when at least two direct statements support it. */
export class BehaviorSignalAggregator {
  constructor(private readonly scoring = new IdentityScoringEngine()) {}

  aggregate(facts: IdentityKnowledgeObject[], dimensions: IdentityDimension[]): BehaviorPattern[] {
    const repeated = repeatedSignals.flatMap((definition) => this.fromRepeatedFacts(definition, facts));
    const communication = dimensions.find((dimension) => dimension.id === "communication");
    if (communication) repeated.push({
      id: "measured-communication-evidence",
      label: "Measured communication evidence",
      detail: communication.value,
      confidence: communication.confidence,
      source: communication.source,
      evidence: communication.evidence,
      version: communication.version,
      timestamp: communication.timestamp,
      evidenceIds: communication.evidenceIds,
    });
    return repeated;
  }

  private fromRepeatedFacts(definition: SignalDefinition, facts: IdentityKnowledgeObject[]): BehaviorPattern[] {
    const supporting = uniqueEvidence(facts.filter(definition.matches));
    if (supporting.length < 2) return [];
    return [{
      id: definition.id,
      label: definition.label,
      detail: definition.detail(supporting.length),
      confidence: this.scoring.score(supporting.map((fact) => fact.provenance.confidence)),
      source: Array.from(new Set(supporting.map((fact) => fact.provenance.source))).join(", "),
      evidence: Array.from(new Set(supporting.map((fact) => `“${fact.provenance.evidence}”`))).join(" "),
      version: supporting[0].provenance.version,
      timestamp: supporting[0].provenance.timestamp,
      evidenceIds: supporting.map((fact) => fact.id),
    }];
  }
}

function uniqueEvidence(facts: IdentityKnowledgeObject[]): IdentityKnowledgeObject[] {
  const byExcerpt = new Map<string, IdentityKnowledgeObject>();
  facts.forEach((fact) => {
    const key = `${fact.provenance.source}|${fact.provenance.evidence}`.toLocaleLowerCase();
    if (!byExcerpt.has(key)) byExcerpt.set(key, fact);
  });
  return [...byExcerpt.values()];
}
