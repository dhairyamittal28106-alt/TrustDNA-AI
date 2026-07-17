import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { GuardianOverview, GuardianState } from "@/features/guardian/types";

export class GuardianKnowledgeAdapter {
  overview(snapshot: GenomeSnapshot, state: GuardianState, activity: string): Omit<GuardianOverview, "insights" | "recommendations"> {
    return {
      state,
      status: statusFor(state),
      activity,
      genomeVersion: snapshot.latestVersion?.version ?? "Awaiting baseline",
      knowledgeCount: snapshot.identityFacts.length,
      confidence: snapshot.genomeConfidence,
      lastUpdate: snapshot.latestVersion?.created_at ?? snapshot.identityFacts[0]?.provenance.timestamp,
      recentKnowledge: [...snapshot.identityFacts].sort((left, right) => right.provenance.timestamp.localeCompare(left.provenance.timestamp)).slice(0, 4),
    };
  }
}

function statusFor(state: GuardianState): string {
  return {
    idle: "Standing by",
    monitoring: "Monitoring Identity Genome",
    learning: "Learning new evidence",
    synchronizing: "Synchronizing Gmail evidence",
    thinking: "Correlating Identity Knowledge",
    investigating: "Coordinating investigation",
    warning: "Evidence needs review",
  }[state];
}
