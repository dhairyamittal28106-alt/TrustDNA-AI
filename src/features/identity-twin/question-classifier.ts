import type { TwinIntent, TwinPipelineName, TwinQuestionType } from "@/features/identity-twin/types";

export type TwinQuestionRoute = {
  questionType: TwinQuestionType;
  pipeline: TwinPipelineName;
  intent: TwinIntent;
  boundaryKind?: "future" | "medical" | "financial" | "legal" | "private";
};

/**
 * Routes a question before any Genome retrieval happens. Ordering is
 * deliberate: prediction boundaries and hybrid life advice must never be
 * mistaken for direct facts just because they contain words such as "career"
 * or "relationship".
 */
export class QuestionClassifier {
  classify(question: string): TwinIntent {
    return this.route(question).intent;
  }

  route(question: string): TwinQuestionRoute {
    const normalized = question.trim();
    if (!normalized) return { questionType: "general_guidance", pipeline: "evidence_informed_guidance", intent: "unknown" };

    const boundaryKind = boundaryFor(normalized);
    if (boundaryKind) return { questionType: "boundary", pipeline: "safety_boundary", intent: "prediction_boundary", boundaryKind };
    if (artifactPattern.test(normalized)) return { questionType: "comparison", pipeline: "evidence_comparison", intent: "artifact_comparison" };
    if (comparisonPattern.test(normalized)) return { questionType: "comparison", pipeline: "evidence_comparison", intent: "hybrid_advice" };
    if (explanationPattern.test(normalized)) return { questionType: "explanation", pipeline: "evidence_explanation", intent: "identity_reasoning" };
    if (metaPattern.test(normalized) || evidenceRequirementsPattern.test(normalized)) return { questionType: "meta", pipeline: "genome_meta", intent: "evidence_requirements" };
    if (identitySummaryPattern.test(normalized)) return { questionType: "identity_summary", pipeline: "profile_aggregation", intent: "identity_summary" };
    if (identityFactPattern.test(normalized)) return { questionType: "identity_facts", pipeline: "direct_knowledge", intent: "identity_facts" };
    if (identityReasoningPattern.test(normalized)) return { questionType: "decision_support", pipeline: "identity_reasoning", intent: "identity_reasoning" };
    if (hybridAdvicePattern.test(normalized) || decisionPattern.test(normalized)) return { questionType: "decision_support", pipeline: "evidence_informed_guidance", intent: "hybrid_advice" };
    if (communicationPattern.test(normalized)) return { questionType: "communication", pipeline: "communication_analysis", intent: "communication" };
    if (observedKnowledgePattern.test(normalized)) return { questionType: "observed_knowledge", pipeline: "observed_knowledge", intent: "observed_knowledge" };
    return { questionType: "general_guidance", pipeline: "evidence_informed_guidance", intent: "unknown" };
  }
}

const predictionPattern = /\b(?:who\s+will\s+i\s+marry|when\s+will\s+i\s+die|when\s+will\s+i\s+pass\s+away|lottery\s+numbers?|will\s+i\s+(?:become|be)\s+rich|predict\s+my\s+future|tell\s+me\s+my\s+future|future\s+prediction)\b/i;
const artifactPattern = /\b(?:this|an|the)\s+(?:email|message|artifact|document|resume)|\bdoes\s+(?:this|it).{0,40}\bsound\s+like\s+me\b/i;
const comparisonPattern = /\b(?:compare|which\s+(?:option|choice|path)|option\s+[ab]|choose\s+between|pros\s+and\s+cons)\b/i;
const explanationPattern = /\b(?:why\s+(?:do\s+you\s+)?recommend|why\s+did\s+you|explain\s+(?:your|the)\s+(?:answer|reasoning)|what\s+evidence\s+(?:did|was)|reasoning\s+trace)\b/i;
const metaPattern = /\b(?:genome\s+(?:coverage|health|freshness|version)|what\s+(?:is|are)\s+(?:missing|known)|knowledge\s+(?:gaps|coverage)|how\s+(?:complete|current)\s+is\s+(?:my\s+)?genome)\b/i;

const hybridAdvicePattern = /\b(?:girlfriend|boyfriend|relationship\s+advice|more\s+disciplined|discipline|manage\s+stress|reduce\s+stress|healthier|become\s+healthy|buy\s+a\s+house|buy\s+a\s+home|move\s+abroad|move\s+to\s+another\s+city|relocate|travel|better\s+leader|leadership|leave\s+my\s+job|switch\s+careers?|change\s+careers?|improve\s+(?:my\s+)?communication|prepare\s+for\s+interviews?|make\s+(?:more\s+)?friends|make\s+friends|personal\s+life)\b/i;
const decisionPattern = /\b(?:should\s+i|help\s+me\s+decide|what\s+should\s+i\s+do|best\s+(?:choice|option|path)|recommend\s+(?:a|an|my)|advice)\b/i;

const identityReasoningPattern = /\b(?:should\s+i\s+(?:build|start)\s+(?:my\s+)?start-?up|should\s+i\s+join\s+(?:google|a\s+start-?up|a\s+company)|would\s+entrepreneurship\s+suit\s+me|entrepreneur|founder|higher\s+studies|master'?s|mba|graduate\s+school|startup\s+(?:fit|idea)|career\s+(?:suits?|fit|path)|what\s+career|goal\s+align(?:ment)?|supporting\s+evidence|why\s+(?:do\s+you\s+)?recommend)\b/i;
const identityFactPattern = /\b(?:name|who\s+am\s+i|date\s+of\s+birth|birthday|when\s+was\s+i\s+born|dream|ambition|university|college|school|degree|education|favorite|favourite|cricketer|player|team|project|projects|skill|skills|technology|technologies|goal|goals|current\s+role|timeline|what\s+motivates\s+me|my\s+values|interests)\b/i;
const communicationPattern = /\b(?:communication|communicate|writing|write|email|tone|vocabulary|greeting|signature|sentence|punctuation|style)\b/i;
const observedKnowledgePattern = /\b(?:technology|technologies|skill|skills|domain|expertise|knowledge|know|terms)\b/i;
const evidenceRequirementsPattern = /\b(?:evidence\s+needed|what\s+(?:evidence|information)\s+do\s+you\s+need|missing\s+evidence)\b/i;
const identitySummaryPattern = /\b(?:summarize|summary|about\s+me|identity\s+profile|profile)\b/i;

function boundaryFor(question: string): TwinQuestionRoute["boundaryKind"] {
  if (predictionPattern.test(question)) return "future";
  if (/\b(?:diagnos(?:is|e)|symptom|medication|medical\s+(?:advice|diagnosis)|treatment|prescription)\b/i.test(question)) return "medical";
  if (/\b(?:investment|invest|stock|crypto|tax\s+advice|financial\s+advice|loan\s+approval|mortgage\s+approval)\b/i.test(question)) return "financial";
  if (/\b(?:legal\s+advice|lawsuit|contract\s+advice|criminal|court\s+case)\b/i.test(question)) return "legal";
  if (/\b(?:password|secret|private\s+(?:message|fact|memory)|hidden\s+(?:memory|fact)|romantic\s+partner)\b/i.test(question)) return "private";
  return undefined;
}
