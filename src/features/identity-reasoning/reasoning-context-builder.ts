import type { IdentityReasoningIntent, IdentityProfile, ReasoningContext } from "@/features/identity-reasoning/types";

/** Converts the complete Identity Profile into the single deterministic input to the reasoning engine. */
export class ReasoningContextBuilder {
  build(question: string, intent: IdentityReasoningIntent, profile: IdentityProfile): ReasoningContext {
    return {
      question,
      intent,
      profile,
      dimensions: profile.dimensions,
      behaviorSignals: profile.behaviorSignals,
      values: profile.dimensions.filter((dimension) => dimension.id === "values"),
      goals: profile.dimensions.filter((dimension) => dimension.id === "goals" || dimension.id === "dreams"),
      motivations: profile.dimensions.filter((dimension) => dimension.id === "motivations"),
    };
  }
}
