import type { BehaviorPattern, IdentityDecision, IdentityDimension, ReasoningEvidence, ReasoningGraph } from "@/features/identity-reasoning/types";

/** Builds a visible, serializable explanation graph rather than retaining hidden reasoning. */
export class ReasoningGraphBuilder {
  build(question: string, dimensions: IdentityDimension[], patterns: BehaviorPattern[], evidence: ReasoningEvidence[], decision: IdentityDecision): ReasoningGraph {
    const questionId = "question";
    const decisionId = "decision";
    const nodes: ReasoningGraph["nodes"] = [
      { id: questionId, label: question, kind: "question" },
      { id: decisionId, label: decision.label, kind: "decision" },
    ];
    const edges: ReasoningGraph["edges"] = [{ from: questionId, to: decisionId, relationship: "informs" }];

    dimensions.filter((dimension) => evidence.some((item) => item.category === dimension.id)).forEach((dimension) => {
      const dimensionId = `dimension-${dimension.id}`;
      nodes.push({ id: dimensionId, label: dimension.label, kind: "dimension" });
      edges.push({ from: questionId, to: dimensionId, relationship: "uses" });
      edges.push({ from: dimensionId, to: decisionId, relationship: "informs" });
    });

    evidence.forEach((item) => {
      const evidenceId = `evidence-${item.id}`;
      nodes.push({ id: evidenceId, label: item.title, kind: "evidence" });
      edges.push({ from: evidenceId, to: `dimension-${item.category}`, relationship: "supports" });
    });

    patterns.filter((pattern) => pattern.evidenceIds.some((id) => evidence.some((item) => item.id === id))).forEach((pattern) => {
      const patternId = `behavior-${pattern.id}`;
      nodes.push({ id: patternId, label: pattern.label, kind: "behavior" });
      edges.push({ from: patternId, to: decisionId, relationship: "informs" });
      pattern.evidenceIds
        .filter((evidenceId) => evidence.some((item) => item.id === evidenceId))
        .forEach((evidenceId) => edges.push({ from: `evidence-${evidenceId}`, to: patternId, relationship: "supports" }));
    });

    return { nodes, edges };
  }
}
