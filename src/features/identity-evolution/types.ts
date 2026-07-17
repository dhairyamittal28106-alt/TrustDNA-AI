import type { IdentityGenomeVersionResponse, GenomeSnapshot } from "@/features/identity-intelligence/types";

export type GenomeChangeKind = "added" | "removed" | "updated" | "unchanged";

export type GenomeChange = {
  id: string;
  kind: GenomeChangeKind;
  category: "source_coverage" | "observed_knowledge" | "communication" | "writing" | "professional";
  label: string;
  detail: string;
};

export type GenomeConfidenceDelta = {
  previous?: number;
  current: number;
  delta?: number;
};

export type GenomeDiff = {
  from?: IdentityGenomeVersionResponse;
  to: IdentityGenomeVersionResponse;
  sourceDelta: number;
  observedKnowledgeAdded: string[];
  observedKnowledgeRemoved: string[];
  confidence: GenomeConfidenceDelta;
  changes: GenomeChange[];
  limitations: string[];
};

export type GuardianEvolutionInsight = {
  id: string;
  title: string;
  observation: string;
  detail: string;
  timestamp: string;
};

export type EvolutionRecommendation = {
  id: string;
  title: string;
  detail: string;
  suggestedSources: string[];
  status: "available_now" | "future_supported";
};

export type GenomeVersionEvolution = {
  version: IdentityGenomeVersionResponse;
  sourceLabel?: string;
  diff: GenomeDiff;
  guardianInsight: GuardianEvolutionInsight;
};

export type GenomeEvolutionState = {
  snapshot: GenomeSnapshot;
  versions: GenomeVersionEvolution[];
  latest?: GenomeVersionEvolution;
  recommendations: EvolutionRecommendation[];
};

export type TwinSynchronizationUpdate = {
  userId: string;
  genomeId: string;
  version: string;
  updatedAt: string;
};
