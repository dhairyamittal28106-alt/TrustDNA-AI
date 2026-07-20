import type { GenomeSnapshot } from "@/features/identity-intelligence/types";

export type GenomeHologramSignal = {
  id: string;
  label: string;
  evidenceCount: number;
  confidence: number | null;
  version?: string;
  lastUpdated?: string;
};

type SignalDefinition = {
  id: string;
  label: string;
  categories?: string[];
  factKeys?: string[];
  measured?: boolean;
};

const definitions: SignalDefinition[] = [
  { id: "identity", label: "Identity", categories: ["identity"], factKeys: ["name", "date_of_birth", "gender", "nationality"] },
  { id: "education", label: "Education", categories: ["education"], factKeys: ["university", "degree", "department", "school"] },
  { id: "skills", label: "Skills", categories: ["skills", "technologies"], factKeys: ["programming_language", "skill", "technology", "framework"] },
  { id: "projects", label: "Projects", categories: ["projects"], factKeys: ["project"] },
  { id: "dreams", label: "Dreams", categories: ["goals"], factKeys: ["dream"] },
  { id: "goals", label: "Goals", categories: ["goals"], factKeys: ["goal", "career"] },
  { id: "values", label: "Values", categories: ["values"], factKeys: ["value"] },
  { id: "motivations", label: "Motivations", categories: ["motivations"], factKeys: ["motivation"] },
  { id: "interests", label: "Interests", categories: ["interests", "sports"], factKeys: ["interest", "sport", "favorite_player"] },
  { id: "behavior_patterns", label: "Behavior", measured: true },
  { id: "communication", label: "Communication", measured: true },
];

/** Builds presentational signals exclusively from the already loaded Genome. */
export function buildGenomeHologramSignals(snapshot: GenomeSnapshot): GenomeHologramSignal[] {
  const activeFacts = snapshot.knowledgeHistory.filter((fact) => fact.status === "active");
  const latestVersion = snapshot.latestVersion?.version;
  const latestTimestamp = snapshot.profile?.updated_at ?? snapshot.latestVersion?.created_at;

  return definitions.map((definition) => {
    if (definition.measured) {
      const hasMeasurement = definition.id === "communication"
        ? Boolean(snapshot.features)
        : snapshot.hasExtractedKnowledge && activeFacts.length > 0;
      return {
        id: definition.id,
        label: definition.label,
        evidenceCount: hasMeasurement ? 1 : 0,
        confidence: hasMeasurement && snapshot.genomeConfidence !== undefined ? snapshot.genomeConfidence / 100 : null,
        version: latestVersion,
        lastUpdated: latestTimestamp,
      };
    }

    const facts = activeFacts.filter((fact) => definition.categories?.includes(fact.category) || definition.factKeys?.includes(fact.factKey));
    const confidence = facts.length
      ? facts.reduce((total, fact) => total + fact.provenance.confidence, 0) / facts.length
      : null;
    return {
      id: definition.id,
      label: definition.label,
      evidenceCount: facts.length,
      confidence,
      version: latestVersion,
      lastUpdated: facts.map((fact) => fact.provenance.timestamp).sort().at(-1) ?? latestTimestamp,
    };
  });
}

export function genomeHealth(signals: GenomeHologramSignal[]): number {
  const covered = signals.filter((signal) => signal.evidenceCount > 0).length / Math.max(signals.length, 1);
  const confidence = signals.filter((signal) => signal.confidence !== null);
  const meanConfidence = confidence.length
    ? confidence.reduce((total, signal) => total + (signal.confidence ?? 0), 0) / confidence.length
    : 0;
  return Math.round((covered * 0.58 + meanConfidence * 0.42) * 100);
}
