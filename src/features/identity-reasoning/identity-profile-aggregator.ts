import { BehaviorSignalAggregator } from "@/features/identity-reasoning/behavior-signal-aggregator";
import { CareerProfileBuilder } from "@/features/identity-reasoning/career-profile-builder";
import { GoalExtractor } from "@/features/identity-reasoning/goal-extractor";
import { IdentityDimensionBuilder } from "@/features/identity-reasoning/identity-dimension-builder";
import { MotivationExtractor } from "@/features/identity-reasoning/motivation-extractor";
import { ValueExtractor } from "@/features/identity-reasoning/value-extractor";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { BehaviorPattern, IdentityDimension, IdentityDimensionId, IdentityProfile } from "@/features/identity-reasoning/types";

type FactDimensionDefinition = {
  id: IdentityDimensionId;
  label: string;
  factKeys: string[];
};

const factDimensions: FactDimensionDefinition[] = [
  { id: "identity", label: "Identity", factKeys: ["name", "date_of_birth", "gender", "nationality"] },
  { id: "education", label: "Education", factKeys: ["university", "degree", "branch", "department", "education_start_year", "education_end_year", "education_status", "school"] },
  { id: "projects", label: "Projects", factKeys: ["project"] },
  { id: "skills", label: "Technical Skills", factKeys: ["programming_language", "skill", "technology"] },
  { id: "frameworks", label: "Frameworks", factKeys: ["framework"] },
  { id: "interests", label: "Interests", factKeys: ["interest"] },
  { id: "sports", label: "Sports", factKeys: ["sport", "favorite_player"] },
];

/** Synthesizes an explainable profile from all available direct facts and measured text features. */
export class IdentityProfileAggregator {
  constructor(
    private readonly dimensions = new IdentityDimensionBuilder(),
    private readonly goals = new GoalExtractor(),
    private readonly values = new ValueExtractor(),
    private readonly motivations = new MotivationExtractor(),
    private readonly career = new CareerProfileBuilder(),
    private readonly behaviors = new BehaviorSignalAggregator(),
  ) {}

  aggregate(snapshot: GenomeSnapshot): IdentityProfile {
    const facts = snapshot.knowledgeHistory.filter((fact) => fact.status === "active");
    const directDimensions = factDimensions
      .map((definition) => this.dimensions.fromFacts(definition.id, definition.label, facts.filter((fact) => definition.factKeys.includes(fact.factKey))))
      .filter((dimension): dimension is IdentityDimension => dimension !== null);
    const profileDimensions = [
      ...directDimensions,
      this.dimensions.fromFacts("goals", "Goals", this.goals.goals(facts)),
      this.dimensions.fromFacts("dreams", "Dreams", this.goals.dreams(facts)),
      this.career.build(facts),
      this.dimensions.fromSignals("values", "Stated Values & Priorities", this.values.extract(facts)),
      this.dimensions.fromSignals("motivations", "Motivations", this.motivations.extract(facts)),
      this.communicationDimension(snapshot),
    ].filter((dimension): dimension is IdentityDimension => dimension !== null);
    const capabilityDimensions = profileDimensions.filter((dimension) => ["projects", "skills", "frameworks", "communication"].includes(dimension.id));
    const strengths = this.dimensions.fromDimensions(
      "strengths",
      "Evidence-backed capability areas",
      capabilityDimensions,
      capabilityDimensions.length ? capabilityDimensions.map((dimension) => dimension.label).join(" · ") : "",
    );
    const completeDimensions = strengths ? [...profileDimensions, strengths] : profileDimensions;
    const behaviorSignals = this.behaviors.aggregate(facts, completeDimensions);
    const behavioralDimensions = [
      this.fromBehavior("behavior_patterns", "Behavior Patterns", behaviorSignals, facts),
      this.fromBehavior("learning_style", "Learning-style evidence", behaviorSignals.filter((signal) => signal.id === "repeated-learning-priority"), facts),
      this.fromBehavior("decision_style", "Decision-style evidence", behaviorSignals.filter((signal) => signal.id === "repeated-analytical-decision-evidence"), facts),
      this.fromBehavior("risk_tolerance", "Risk-preference evidence", behaviorSignals.filter((signal) => signal.id === "repeated-risk-language"), facts),
      this.fromBehavior("ownership_preference", "Ownership-preference evidence", behaviorSignals.filter((signal) => signal.id === "repeated-ownership-preference"), facts),
    ].filter((dimension): dimension is IdentityDimension => dimension !== null);
    const sourceLabels = Array.from(new Set(snapshot.sources.filter((source) => source.status === "ingested").map((source) => source.label)));

    return {
      genomeVersion: snapshot.latestVersion?.version,
      sourceCount: snapshot.sourceCount,
      sourceLabels,
      dimensions: [...completeDimensions, ...behavioralDimensions],
      behaviorSignals,
    };
  }

  private communicationDimension(snapshot: GenomeSnapshot): IdentityDimension | null {
    const features = snapshot.features;
    if (!features || snapshot.genomeConfidence === undefined) return null;
    const sources = snapshot.sources.filter((source) => source.status === "ingested").map((source) => source.label);
    const timestamp = snapshot.profile?.updated_at ?? snapshot.latestVersion?.created_at;
    if (!timestamp) return null;
    return this.dimensions.fromSignals("communication", "Communication Measurements", [{
      id: "measured-communication",
      value: `Professional tone ${Math.round(features.professional_tone * 100)}% · average sentence length ${Math.round(features.average_sentence_length)} words`,
      source: sources.join(", ") || "Analyzed text evidence",
      evidence: "Deterministic metrics measured from consented analyzed text.",
      version: snapshot.latestVersion?.version ?? "Current Genome",
      timestamp,
      confidence: snapshot.genomeConfidence / 100,
    }]);
  }

  private fromBehavior(id: IdentityDimensionId, label: string, signals: BehaviorPattern[], facts: IdentityKnowledgeObject[]): IdentityDimension | null {
    const evidenceIds = new Set(signals.flatMap((signal) => signal.evidenceIds));
    const supportingFacts = facts.filter((fact) => evidenceIds.has(fact.id));
    if (!supportingFacts.length) return null;
    return this.dimensions.fromSignals(id, label, supportingFacts.map((fact) => ({
      id: fact.id,
      value: signals.map((signal) => signal.label).join(" · "),
      source: fact.provenance.source,
      evidence: fact.provenance.evidence,
      version: fact.provenance.version,
      timestamp: fact.provenance.timestamp,
      confidence: fact.provenance.confidence,
    })));
  }
}
