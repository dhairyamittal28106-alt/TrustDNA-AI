import { IdentityProfileAggregator } from "@/features/identity-reasoning/identity-profile-aggregator";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";
import type { IdentityDimension, IdentityDimensionId } from "@/features/identity-reasoning/types";
import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import type { HybridAdvice, TwinEvidence } from "@/features/identity-twin/types";

type HybridAdviceTopic =
  | "relationship"
  | "discipline"
  | "relocation"
  | "health"
  | "housing"
  | "leadership"
  | "career_transition"
  | "communication"
  | "interviews"
  | "friendship"
  | "stress"
  | "travel"
  | "general";

type TopicGuide = {
  label: string;
  summary: string;
  actions: string[];
  unknown: string[];
  relevantDimensions: IdentityDimensionId[];
};

/**
 * Produces deterministic, bounded life guidance. Identity facts are selected
 * from the current Profile; the guidance checklist is static general knowledge
 * and is deliberately labelled as such in every response.
 */
export class HybridIdentityAdvisor {
  constructor(private readonly profileAggregator = new IdentityProfileAggregator()) {}

  advise(question: string, snapshot: GenomeSnapshot): { advice: HybridAdvice; evidence: TwinEvidence[]; confidence: number | null } {
    const topic = topicFor(question);
    const guide = guides[topic];
    const profile = this.profileAggregator.aggregate(snapshot);
    const dimensions = selectDimensions(profile.dimensions, guide.relevantDimensions);
    const evidence = mergeEvidence("advisorEvidence", dimensions.map(toEvidence));
    const identityEntries = dimensions.map((dimension) => ({ label: dimension.label, value: dimension.value }));
    const identityContext = identityEntries.length
      ? `The current Identity Genome contains direct, versioned context for ${identityEntries.map((entry) => entry.label.toLocaleLowerCase()).join(", ")}.`
      : "The current Identity Genome has no directly recorded context that can safely personalize this question yet.";
    const alignment = alignmentFor(guide, identityEntries);

    return {
      advice: {
        topic: guide.label,
        identityContext: { summary: identityContext, evidence: identityEntries },
        generalGuidance: { summary: guide.summary, actions: guide.actions },
        alignment,
        evidenceBoundary: {
          identityEvidence: identityEntries.length
            ? identityEntries.map((entry) => `${entry.label}: ${entry.value}`)
            : ["No directly relevant Identity Genome evidence is recorded."],
          generalKnowledge: "The guidance checklist is general decision-support information. It is not derived from your Identity Genome and is not a prediction.",
          unknown: guide.unknown,
        },
      },
      evidence,
      confidence: dimensions.length
        ? Math.round(dimensions.reduce((total, dimension) => total + dimension.confidence, 0) / dimensions.length * 100)
        : null,
    };
  }
}

function topicFor(question: string): HybridAdviceTopic {
  const normalized = question.toLocaleLowerCase();
  if (/\b(girlfriend|boyfriend|relationship)\b/.test(normalized)) return "relationship";
  if (/\b(disciplined|discipline)\b/.test(normalized)) return "discipline";
  if (/\b(move abroad|another city|relocat|abroad)\b/.test(normalized)) return "relocation";
  if (/\b(healthier|healthy|health)\b/.test(normalized)) return "health";
  if (/\b(house|home|mortgage|property)\b/.test(normalized)) return "housing";
  if (/\b(leader|leadership|lead a team)\b/.test(normalized)) return "leadership";
  if (/\b(leave my job|switch careers?|change careers?|career change)\b/.test(normalized)) return "career_transition";
  if (/\b(improve (?:my )?communication|communicate better|communication)\b/.test(normalized)) return "communication";
  if (/\b(interview|interviews)\b/.test(normalized)) return "interviews";
  if (/\b(make (?:more )?friends|friendship|friends)\b/.test(normalized)) return "friendship";
  if (/\b(stress|stressed|burnout)\b/.test(normalized)) return "stress";
  if (/\b(travel|trip)\b/.test(normalized)) return "travel";
  return "general";
}

function selectDimensions(dimensions: IdentityDimension[], ids: IdentityDimensionId[]): IdentityDimension[] {
  return dimensions.filter((dimension) => ids.includes(dimension.id));
}

function toEvidence(dimension: IdentityDimension): TwinEvidence {
  return {
    id: `profile-${dimension.id}`,
    title: dimension.label,
    detail: `${dimension.value}. Evidence: ${dimension.evidence}`,
    category: dimension.id,
    origin: dimension.id === "communication" || dimension.id.includes("style") || dimension.id === "behavior_patterns" ? "derived" : "extracted",
    sources: dimension.source.split(", ").filter(Boolean),
    updatedAt: dimension.timestamp,
  };
}

function alignmentFor(guide: TopicGuide, entries: Array<{ label: string; value: string }>): HybridAdvice["alignment"] {
  if (!entries.length) {
    return {
      summary: "There is no recorded Identity Evidence to personalize this decision. Use the general checklist as a starting point, not as a recommendation about your life.",
      considerations: ["Add directly stated priorities or constraints only if you want future alignment analysis.", "A decision can be reasonable even when the Identity Genome has no evidence about it."],
    };
  }

  return {
    summary: `Use the documented ${entries.map((entry) => entry.label.toLocaleLowerCase()).join(", ")} as comparison points for this decision. They can inform reflection, but they cannot determine the outcome or replace your judgment.`,
    considerations: [
      `Check whether the option supports or conflicts with: ${entries.map((entry) => entry.value).join(" · ")}.`,
      "Validate this reflection with current practical constraints and the people affected before acting.",
    ],
  };
}

const guides: Record<HybridAdviceTopic, TopicGuide> = {
  relationship: {
    label: "Relationships",
    summary: "Healthy relationships depend on mutual respect, consent, communication, shared expectations, and readiness. There is no universal timing rule for pursuing one.",
    actions: ["Clarify what you want from a relationship and what time and emotional capacity you can offer.", "Discuss expectations, boundaries, and communication early and respectfully.", "Keep personal goals, friendships, and support systems healthy alongside the relationship."],
    unknown: ["Current emotional readiness", "Personal preferences", "Potential partner compatibility", "Current relationship circumstances"],
    relevantDimensions: ["goals", "dreams", "career", "values", "motivations", "interests"],
  },
  discipline: {
    label: "Discipline",
    summary: "Discipline usually improves through a small, repeatable system: choose one behavior, lower the starting friction, schedule it, and review it consistently.",
    actions: ["Pick one concrete daily or weekly commitment and make the first step small enough to start today.", "Use a visible cue, a calendar block, and a simple completion log rather than relying on motivation alone.", "Review what interrupted the routine each week and adjust the environment before increasing the target."],
    unknown: ["Current routine", "Time constraints", "Health and energy needs", "Which habit matters most right now"],
    relevantDimensions: ["goals", "dreams", "values", "motivations", "learning_style", "ownership_preference"],
  },
  relocation: {
    label: "Relocation",
    summary: "Relocation is best evaluated with concrete options: compare the career or education opportunity, legal requirements, cost, support network, lifestyle, and a reversible trial where possible.",
    actions: ["Write down the destination, purpose, expected upside, cost, visa or legal constraints, and a fallback plan.", "Compare at least two realistic destinations against the same criteria.", "Speak with people living or working there and, when feasible, test the move through a visit, program, or time-bounded role."],
    unknown: ["Destination options", "Visa and legal eligibility", "Financial runway", "Support network", "Lifestyle and family constraints"],
    relevantDimensions: ["goals", "dreams", "career", "education", "projects", "values", "motivations"],
  },
  health: {
    label: "Health",
    summary: "Health improvements are usually more sustainable when built around sleep, regular movement, balanced nutrition, stress management, and appropriate professional care rather than extreme short-term changes.",
    actions: ["Choose one sustainable change in movement, meals, sleep, or recovery and track it for two weeks.", "Set goals that fit your schedule and current capacity instead of copying someone else’s routine.", "Consult a qualified health professional for symptoms, diagnoses, medication, or a plan tailored to your medical needs."],
    unknown: ["Medical history", "Current health status", "Dietary needs", "Injuries or medication", "Access to care"],
    relevantDimensions: ["goals", "values", "motivations", "interests"],
  },
  housing: {
    label: "Housing",
    summary: "A home purchase should be treated as a financial and lifestyle decision: compare total ownership cost, stability of income, time horizon, location needs, liquidity, and alternatives such as renting.",
    actions: ["Calculate the full monthly and one-time cost, including maintenance, taxes, insurance, and an emergency buffer.", "Compare buying with renting for the length of time you realistically expect to stay.", "Seek regulated financial or legal advice for local contracts, lending, taxes, and affordability."],
    unknown: ["Income and savings", "Debt and credit position", "Location", "Time horizon", "Local market conditions"],
    relevantDimensions: ["goals", "career", "values", "motivations"],
  },
  leadership: {
    label: "Leadership",
    summary: "Leadership develops through clear communication, follow-through, listening, ethical decision-making, and feedback. It is a practice, not a trait that can be inferred from a profile.",
    actions: ["Take ownership of one bounded project or team responsibility and define success clearly.", "Practice listening first, make decisions transparent, and ask for specific feedback after the work is complete.", "Build the habit of recognizing others’ contributions and addressing disagreements respectfully."],
    unknown: ["Team context", "Prior leadership experience", "Feedback from collaborators", "Specific leadership responsibilities"],
    relevantDimensions: ["projects", "communication", "values", "career", "skills", "behavior_patterns"],
  },
  career_transition: {
    label: "Career transition",
    summary: "Changing or leaving a role is easier to evaluate when you compare the current situation, alternatives, financial runway, learning opportunity, wellbeing, and the risk of each next step.",
    actions: ["Define the reason for change, the non-negotiables, and the smallest reversible next step.", "Research real roles or paths and test them with projects, conversations, or applications before making an irreversible move.", "Plan finances and timing so the decision is not forced by an avoidable short-term constraint."],
    unknown: ["Current role conditions", "Financial obligations", "Available alternatives", "Work environment", "Personal wellbeing"],
    relevantDimensions: ["goals", "dreams", "career", "projects", "skills", "education", "values", "motivations"],
  },
  communication: {
    label: "Communication",
    summary: "Clear communication improves when the audience, purpose, message, and next action are explicit. Practice, feedback, and revision are more reliable than trying to sound impressive.",
    actions: ["Before speaking or writing, state the audience, purpose, and one outcome you want.", "Use a concise structure: context, key point, supporting detail, and next action.", "Ask a trusted person for feedback on clarity and practice with low-stakes conversations first."],
    unknown: ["Communication setting", "Audience", "Feedback from others", "Whether the goal is writing, speaking, or conflict resolution"],
    relevantDimensions: ["communication", "projects", "values", "skills", "behavior_patterns"],
  },
  interviews: {
    label: "Interviews",
    summary: "Interview preparation works best when you understand the role, prepare concise evidence-based stories, practice questions aloud, and learn enough about the organization to ask thoughtful questions.",
    actions: ["Match your projects, skills, and learning examples to the role requirements.", "Prepare short situation-action-result stories that are accurate and easy to explain.", "Practice with a mock interview, then refine answers using specific feedback."],
    unknown: ["Target role", "Organization", "Interview format", "Current résumé", "Specific gaps in the job requirements"],
    relevantDimensions: ["projects", "skills", "frameworks", "education", "career", "communication"],
  },
  friendship: {
    label: "Friendship",
    summary: "Friendships generally grow through repeated shared activities, genuine curiosity, reliable follow-through, and respecting other people’s boundaries.",
    actions: ["Choose one recurring setting built around a genuine interest, class, sport, volunteer activity, or community.", "Start with small invitations and follow up consistently rather than expecting instant closeness.", "Listen, respect boundaries, and let trust build through mutual effort over time."],
    unknown: ["Current social setting", "Preferred communities", "Availability", "Comfort with new social situations"],
    relevantDimensions: ["interests", "sports", "values", "goals", "communication"],
  },
  stress: {
    label: "Stress management",
    summary: "Stress management usually starts with identifying the pressure source, protecting basics such as sleep and recovery, reducing avoidable load, and asking for support when stress is persistent or overwhelming.",
    actions: ["Name the main source of pressure and separate what you can act on this week from what you cannot control.", "Protect a small recovery routine: sleep, movement, meals, breaks, and time away from the stressor.", "Speak to a qualified mental-health professional or local support service if stress is persistent, escalating, or affecting safety."],
    unknown: ["Stress severity", "Health context", "Current support system", "Specific stressors", "Access to professional support"],
    relevantDimensions: ["goals", "values", "motivations", "behavior_patterns"],
  },
  travel: {
    label: "Travel",
    summary: "Travel choices are easier when you set a purpose, budget, safety plan, timing, and desired pace before comparing destinations.",
    actions: ["Choose the purpose of the trip and a realistic total budget before selecting a destination.", "Check entry requirements, safety guidance, insurance, and practical logistics using current official information.", "Plan enough unstructured time to match the pace and experience you want."],
    unknown: ["Budget", "Destination", "Travel documents", "Safety needs", "Time available"],
    relevantDimensions: ["interests", "goals", "values", "career"],
  },
  general: {
    label: "Personal decision",
    summary: "For a personal decision, define the outcome you want, the alternatives, the constraints, and the smallest reversible next step before relying on any recommendation.",
    actions: ["Write down the decision, your alternatives, and what success would look like.", "Separate facts, assumptions, and unknowns before comparing options.", "Test a small reversible step or seek qualified advice when the consequences are material."],
    unknown: ["The specific decision context", "Practical constraints", "People affected", "Relevant professional information"],
    relevantDimensions: ["goals", "dreams", "career", "values", "motivations", "interests"],
  },
};
