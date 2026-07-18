import type { IdentityDecision, IdentityDimension, IdentityReasoningIntent, ReasoningEvidence } from "@/features/identity-reasoning/types";

type DecisionInput = {
  intent: IdentityReasoningIntent;
  dimensions: IdentityDimension[];
  evidence: ReasoningEvidence[];
};

/** Uses fixed decision rules and direct values. It never turns incomplete evidence into a personality prediction. */
export class IdentityDecisionEngine {
  decide({ intent, dimensions, evidence }: DecisionInput): IdentityDecision {
    const values = new Map(dimensions.map((dimension) => [dimension.id, dimension.value]));
    const available = evidence.map((item) => `${item.title}: ${item.value}`);
    const commonMissing = ["Directly stated values or constraints", "Recent decision outcomes", "A specific option with practical constraints"];

    switch (intent) {
      case "identity_summary":
        return this.withEvidence("Evidence-backed profile summary", available, {
          recommendation: "Use this versioned profile as a starting point for reflection, then add direct evidence when your goals, projects, or preferences change.",
          alternativeView: "This is a summary of stored evidence, not a complete portrait of you.",
          missingEvidence: ["Directly stated values", "Verified timeline or work-history evidence"],
        });
      case "motivation":
        return this.withEvidence("Motivation evidence", this.pick(values, ["goals", "career", "interests"]), {
          recommendation: values.has("goals") ? "Use the stated goals as the clearest current motivation signal; validate them against your next concrete decision." : "Add a direct statement about what matters to you before relying on a motivation recommendation.",
          alternativeView: "Goals recorded in one source can change over time and do not establish every motivation.",
          missingEvidence: ["Direct values or priorities", "Recent choices that show what you prioritize"],
        });
      case "strengths":
        return this.withEvidence("Evidence-backed strengths", this.pick(values, ["projects", "skills", "communication"]), {
          recommendation: "Treat these as demonstrated evidence areas, not a ranked assessment of your abilities. Add verified outcomes to strengthen the signal.",
          alternativeView: "Structured projects and skills show what you stated or built; they do not prove performance in every setting.",
          missingEvidence: ["Verified project outcomes", "Peer, mentor, or manager feedback"],
        });
      case "weaknesses":
        return {
          label: "Evidence boundary: weaknesses",
          summary: "The current Identity Genome contains no direct, explainable weakness assessment. TrustDNA will not infer one from projects, skills, or writing style.",
          recommendation: "Add a consented self-reflection or verified feedback source if you want to compare explicitly stated development areas.",
          alternativeView: "The absence of a recorded weakness is not evidence that no development area exists.",
          missingEvidence: ["Direct self-reflection", "Verified feedback", "Outcome or performance evidence"],
        };
      case "career":
        return this.withEvidence("Career-direction evidence", this.pick(values, ["goals", "career", "projects", "skills", "education"]), {
          recommendation: values.has("goals") || values.has("career") ? "Compare next opportunities against your stated goals, career direction, and project evidence; prioritize a reversible test when the option is uncertain." : "Add a direct career goal before using the Twin for a personalized career comparison.",
          alternativeView: "A suitable career also depends on opportunities, financial needs, and working conditions that are not in this Genome.",
          missingEvidence: ["Role constraints and compensation needs", "Verified work outcomes", "Preferred work environment"],
        });
      case "management":
        return this.withEvidence("Management-fit evidence", this.pick(values, ["projects", "communication", "career", "goals"]), {
          recommendation: "Current project and communication evidence can support trying a small leadership responsibility, but it does not establish management readiness. Test it through a bounded team or project role.",
          alternativeView: "Management fit depends on people leadership, conflict handling, and feedback—none can be inferred from the available facts.",
          missingEvidence: ["Team leadership experience", "Feedback from collaborators", "Direct management preference"],
        });
      case "entrepreneurship":
        return this.withEvidence("Entrepreneurship-fit evidence", this.pick(values, ["goals", "projects", "career", "skills"]), {
          recommendation: values.has("projects") || values.has("goals") ? "The recorded goals and project evidence support exploring product-building through a small, time-bounded experiment. They do not establish business readiness or risk tolerance." : "Add direct goals, project evidence, or career preferences before assessing entrepreneurship alignment.",
          alternativeView: "Employment can also build skills, network, and runway; the current Genome does not contain financial or market evidence to weigh that trade-off.",
          missingEvidence: ["Financial runway and risk constraints", "Customer or market evidence", "Direct preference for ownership versus employment"],
        });
      case "higher_studies":
        return this.withEvidence("Higher-studies evidence", this.pick(values, ["education", "goals", "career", "skills"]), {
          recommendation: "Evaluate higher studies against the next capability your stated goals require, then compare program outcomes, cost, and opportunity cost before deciding.",
          alternativeView: "Work, projects, or certifications may meet the same goal more effectively; the current Genome cannot rank those paths without constraints.",
          missingEvidence: ["Target program and field", "Budget and opportunity cost", "Specific capability gap"],
        });
      case "relocation":
        return {
          label: "Relocation evidence boundary",
          summary: "The current Identity Genome has no direct location preference, immigration constraint, support-network, or cost-of-living evidence.",
          recommendation: "Do not treat the Twin as a personalized relocation advisor yet. Add direct location preferences and constraints, then compare concrete destinations against them.",
          alternativeView: "Career or education goals may matter, but they are insufficient to determine whether moving abroad is right for you.",
          missingEvidence: ["Preferred locations", "Visa and financial constraints", "Support-network and lifestyle priorities"],
        };
      case "startup_fit":
        return this.withEvidence("Startup-fit evidence", this.pick(values, ["goals", "projects", "career", "skills"]), {
          recommendation: "Use the recorded project, goal, and career evidence to assess the startup's mission and role. Validate the fit with the startup's stage, team, compensation, and learning opportunity before deciding.",
          alternativeView: "The current Genome contains no evidence about this particular startup, its culture, or your practical constraints.",
          missingEvidence: ["Startup role and mission", "Financial and risk constraints", "Team and culture evidence"],
        });
      case "goal_alignment":
        return this.withEvidence("Goal-alignment evidence", this.pick(values, ["goals", "career", "projects", "interests"]), {
          recommendation: values.has("goals") ? "Compare the specific decision against the directly stated goals above. The Twin needs the option's expected outcome and trade-offs to evaluate alignment more precisely." : "Add direct goals and decision context before requesting an alignment recommendation.",
          alternativeView: "An option can align with one goal while conflicting with an unrecorded constraint or priority.",
          missingEvidence: ["The specific decision and alternatives", "Expected outcomes and trade-offs", "Current constraints"],
        });
      case "evidence_support":
        return this.withEvidence("Recommendation evidence", available, {
          recommendation: "Use the cited evidence as an audit trail. Add or correct a fact if it no longer represents you before making a decision from it.",
          alternativeView: "Evidence coverage is not the same as certainty; uncaptured facts may change the recommendation.",
          missingEvidence: commonMissing,
        });
      case "general_decision":
        return this.withEvidence("Decision-support evidence", this.pick(values, ["goals", "career", "projects", "interests", "education"]), {
          recommendation: "Use the recorded evidence to frame questions, not to replace judgment. Add the option, alternatives, and constraints for a more useful comparison.",
          alternativeView: "The current Genome may omit practical and personal context that changes the decision.",
          missingEvidence: commonMissing,
        });
    }
  }

  private withEvidence(label: string, evidence: string[], details: Omit<IdentityDecision, "label" | "summary">): IdentityDecision {
    const summary = evidence.length
      ? `Current recorded evidence: ${evidence.join(" · ")}.`
      : "No directly relevant structured Identity Genome evidence is available for this question.";
    return { label, summary, ...details };
  }

  private pick(values: Map<string, string>, ids: string[]): string[] {
    return ids.flatMap((id) => values.has(id) ? [`${labelFor(id)}: ${values.get(id)}`] : []);
  }
}

function labelFor(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
