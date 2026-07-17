import { GenomeDiffEngine } from "@/features/identity-evolution/genome-diff-engine";
import { GuardianInsightService } from "@/features/identity-evolution/guardian-insight-service";
import { GenomeVersionManager } from "@/features/identity-evolution/genome-version-manager";
import { RecommendationEngine } from "@/features/identity-evolution/recommendation-engine";
import { TwinSynchronizationService } from "@/features/identity-evolution/twin-synchronization-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GenomeEvolutionState, TwinSynchronizationUpdate } from "@/features/identity-evolution/types";

export class GenomeEvolutionService {
  constructor(
    private readonly versionManager = new GenomeVersionManager(),
    private readonly diffEngine = new GenomeDiffEngine(),
    private readonly guardianInsightService = new GuardianInsightService(),
    private readonly recommendationEngine = new RecommendationEngine(),
    private readonly twinSynchronizationService = new TwinSynchronizationService(),
  ) {}

  evolve(snapshot: GenomeSnapshot): GenomeEvolutionState {
    const versions = this.versionManager.ordered(snapshot).map((version) => {
      const diff = this.diffEngine.compare(this.versionManager.previous(snapshot, version), version);
      return {
        version,
        sourceLabel: this.versionManager.sourceLabelForVersion(snapshot, version),
        diff,
        guardianInsight: this.guardianInsightService.observe(diff),
      };
    });
    return { snapshot, versions, latest: versions[0], recommendations: this.recommendationEngine.recommend(snapshot) };
  }

  synchronize(userId: string, snapshot: GenomeSnapshot): void {
    const version = snapshot.latestVersion;
    const genomeId = snapshot.genome?.id;
    if (!version || !genomeId) return;
    const update: TwinSynchronizationUpdate = { userId, genomeId, version: version.version, updatedAt: version.created_at };
    this.twinSynchronizationService.publish(update);
  }
}
