import type { IdentityDimension, IdentityProfile } from "@/features/identity-reasoning/types";

export type PersonaSimulation = {
  content: string;
  confidence: number;
  dimensions: string[];
};

const personaDimensionIds = new Set([
  "goals",
  "dreams",
  "career",
  "projects",
  "skills",
  "values",
  "motivations",
  "behavior_patterns",
  "communication",
]);

/**
 * Produces a deterministic, explicitly bounded persona simulation from active
 * Identity Profile dimensions. It never creates memories or hidden traits.
 */
export class PersonaConsistencyEngine {
  simulate(profile: IdentityProfile, selected: IdentityDimension[]): PersonaSimulation | null {
    const candidates = (selected.length ? selected : profile.dimensions)
      .filter((dimension) => personaDimensionIds.has(dimension.id))
      .filter((dimension) => dimension.evidenceIds.length > 0)
      .slice(0, 3);
    if (!candidates.length) return null;

    const labels = candidates.map((dimension) => dimension.label);
    const priorities = candidates.map((dimension) => dimension.value).join(" · ");
    const confidence = Math.round(candidates.reduce((total, dimension) => total + dimension.confidence, 0) / candidates.length * 100);
    // A weak signal may inform general guidance, but cannot support a persona
    // simulation that sounds personal or certain.
    if (confidence < 45) return null;
    return {
      content: `Based on the recorded ${labels.map((label) => label.toLocaleLowerCase()).join(", ")}, this Twin would likely weigh the option against: ${priorities}. This is a deterministic simulation of documented priorities in the current Genome—not a memory, prediction, or claim about an unrecorded preference.`,
      confidence,
      dimensions: labels,
    };
  }
}
