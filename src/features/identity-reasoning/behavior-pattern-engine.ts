import type { BehaviorPattern, IdentityDimension } from "@/features/identity-reasoning/types";

/** Produces only measurable, evidence-linked behavior signals; it never labels personality. */
export class BehaviorPatternEngine {
  extract(dimensions: IdentityDimension[]): BehaviorPattern[] {
    const byId = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
    const patterns: BehaviorPattern[] = [];
    const projects = byId.get("projects");
    const goals = byId.get("goals");
    const skills = byId.get("skills");
    const communication = byId.get("communication");

    if (projects) patterns.push({
      id: "direct-project-evidence",
      label: "Project-building evidence",
      detail: "The current Genome contains one or more direct project statements.",
      confidence: projects.confidence,
      evidenceIds: projects.evidenceIds,
    });
    if (goals) patterns.push({
      id: "direct-long-term-goal",
      label: "Long-term direction evidence",
      detail: "The current Genome contains directly stated dreams or goals.",
      confidence: goals.confidence,
      evidenceIds: goals.evidenceIds,
    });
    if (projects && skills) patterns.push({
      id: "technical-builder-evidence",
      label: "Technical builder evidence",
      detail: "Direct project statements and structured technical-skill evidence are both present.",
      confidence: Math.min(projects.confidence, skills.confidence),
      evidenceIds: [...projects.evidenceIds, ...skills.evidenceIds],
    });
    if (communication) patterns.push({
      id: "measured-communication-evidence",
      label: "Measured communication evidence",
      detail: communication.value,
      confidence: communication.confidence,
      evidenceIds: communication.evidenceIds,
    });
    return patterns;
  }
}
