import { GenomeEvolutionService } from "@/features/identity-evolution/genome-evolution-service";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";

 
export class TwinRefreshCoordinator {
  private readonly evolution = new GenomeEvolutionService();

  refresh(userId: string, snapshot: GenomeSnapshot): void {
    this.evolution.synchronize(userId, snapshot);
  }
}
