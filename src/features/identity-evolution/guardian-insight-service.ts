import type { GenomeDiff, GuardianEvolutionInsight } from "@/features/identity-evolution/types";

export class GuardianInsightService {
  observe(diff: GenomeDiff): GuardianEvolutionInsight {
    const timestamp = diff.to.created_at;
    return {
      id: `guardian-${diff.to.id}`,
      title: diff.from ? `Guardian update for ${diff.to.version}` : `Genome ${diff.to.version} established`,
      observation: diff.to.guardian_observation,
      detail: "This stored Guardian observation is a deterministic version summary, not a personality or capability claim.",
      timestamp,
    };
  }
}
