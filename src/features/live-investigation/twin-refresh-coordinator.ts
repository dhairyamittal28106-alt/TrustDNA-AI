import { GenomeEvolutionService } from "@/features/identity-evolution/genome-evolution-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";

/** Publishes the new backend Genome version to the existing Twin synchronization boundary. */
export class TwinRefreshCoordinator {
  private readonly evolution = new GenomeEvolutionService();

  refresh(userId: string, snapshot: GenomeSnapshot): void {
    this.evolution.synchronize(userId, snapshot);
  }
}
