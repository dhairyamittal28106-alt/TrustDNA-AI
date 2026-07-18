import { IdentityScoringEngine } from "@/features/identity-reasoning/identity-scoring-engine";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { IdentityDimension, IdentityDimensionId } from "@/features/identity-reasoning/types";

export type ExplicitProfileSignal = {
  id: string;
  value: string;
  source: string;
  evidence: string;
  version: string;
  timestamp: string;
  confidence: number;
};

/** Builds provenance-complete dimensions from direct facts or transparent deterministic signals. */
export class IdentityDimensionBuilder {
  constructor(private readonly scoring = new IdentityScoringEngine()) {}

  fromFacts(id: IdentityDimensionId, label: string, facts: IdentityKnowledgeObject[]): IdentityDimension | null {
    if (!facts.length) return null;
    return this.fromSignals(id, label, facts.map((fact) => ({
      id: fact.id,
      value: fact.value,
      source: fact.provenance.source,
      evidence: fact.provenance.evidence,
      version: fact.provenance.version,
      timestamp: fact.provenance.timestamp,
      confidence: fact.provenance.confidence,
    })));
  }

  fromSignals(id: IdentityDimensionId, label: string, signals: ExplicitProfileSignal[]): IdentityDimension | null {
    if (!signals.length) return null;
    const newest = [...signals].sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
    return {
      id,
      label,
      value: unique(signals.map((signal) => signal.value)).join(" · "),
      confidence: this.scoring.score(signals.map((signal) => signal.confidence)),
      source: unique(signals.map((signal) => signal.source)).join(", "),
      evidence: unique(signals.map((signal) => `“${signal.evidence}”`)).join(" "),
      version: newest.version,
      timestamp: newest.timestamp,
      evidenceIds: signals.map((signal) => signal.id),
    };
  }

  fromDimensions(id: IdentityDimensionId, label: string, dimensions: IdentityDimension[], value: string): IdentityDimension | null {
    if (!dimensions.length) return null;
    const newest = [...dimensions].sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
    return {
      id,
      label,
      value,
      confidence: this.scoring.score(dimensions.map((dimension) => dimension.confidence)),
      source: unique(dimensions.map((dimension) => dimension.source)).join(", "),
      evidence: dimensions.map((dimension) => dimension.evidence).join(" "),
      version: newest.version,
      timestamp: newest.timestamp,
      evidenceIds: dimensions.flatMap((dimension) => dimension.evidenceIds),
    };
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
