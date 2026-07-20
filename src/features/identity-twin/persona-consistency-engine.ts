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

const priority = ["dreams", "goals", "career", "projects", "values", "motivations", "skills", "behavior_patterns", "communication"];

/**
 * Produces a deterministic, evidence-bounded stance from the active Identity
 * Profile. It never creates memories, private facts, or future certainty.
 */
export class PersonaConsistencyEngine {
  simulate(profile: IdentityProfile, selected: IdentityDimension[], question: string): PersonaSimulation | null {
    const candidates = (selected.length ? selected : profile.dimensions)
      .filter((dimension) => personaDimensionIds.has(dimension.id))
      .filter((dimension) => dimension.evidenceIds.length > 0)
      .sort((left, right) => priority.indexOf(left.id) - priority.indexOf(right.id))
      .slice(0, 3);
    if (!candidates.length) return null;

    const confidence = Math.round(candidates.reduce((total, dimension) => total + dimension.confidence, 0) / candidates.length * 100);
    if (confidence < 45) return null;

    const priorities = naturalList(candidates.map((dimension) => cleanValue(dimension.value)).filter(Boolean));
    return {
      content: `Given ${priorities}, your Twin would ${stanceFor(question)} This is a deterministic stance from documented priorities in the current Genome, not a prediction or an unrecorded personal fact.`,
      confidence,
      dimensions: candidates.map((dimension) => dimension.label),
    };
  }
}

function stanceFor(question: string) {
  const normalized = question.toLocaleLowerCase();
  if (/\b(weakness|weaknesses|improve|blind spot)\b/.test(normalized)) {
    return "challenge whether its drive to execute is crowding out the deliberate learning, feedback, or recovery needed to sustain that direction.";
  }
  if (/\b(startup|start-up|founder|business)\b/.test(normalized)) {
    return "continue building the startup through a narrowly scoped, evidence-backed milestone unless another opportunity directly accelerates the same mission.";
  }
  if (/\b(job|career|role|work)\b/.test(normalized)) {
    return "choose the path that compounds hands-on product-building capability and advances those recorded priorities, rather than a path that only adds a title.";
  }
  if (/\b(master'?s|mba|higher studies|postgraduate|graduate school)\b/.test(normalized)) {
    return "pursue further study only when it unlocks a concrete capability or network required for the documented direction.";
  }
  if (/\b(compare|versus|vs\.?|which)\b/.test(normalized)) {
    return "select the option that reinforces those commitments and pause when an option clearly conflicts with them.";
  }
  return "take the option that advances those documented priorities and reject one that clearly conflicts with them.";
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").replace(/[;,:]+$/, "").trim();
}

function naturalList(values: string[]) {
  const items = Array.from(new Set(values)).slice(0, 3);
  if (items.length < 2) return items[0] ?? "the available documented priorities";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}
