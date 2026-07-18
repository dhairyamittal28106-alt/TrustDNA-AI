import type { TwinIntent } from "@/features/identity-twin/types";

/**
 * Routes a question before any Genome retrieval happens. Ordering is
 * deliberate: prediction boundaries and hybrid life advice must never be
 * mistaken for direct facts just because they contain words such as "career"
 * or "relationship".
 */
export class QuestionClassifier {
  classify(question: string): TwinIntent {
    const normalized = question.trim();
    if (!normalized) return "unknown";

    if (predictionPattern.test(normalized)) return "prediction_boundary";
    if (artifactPattern.test(normalized)) return "artifact_comparison";
    if (hybridAdvicePattern.test(normalized)) return "hybrid_advice";
    if (identityReasoningPattern.test(normalized)) return "identity_reasoning";
    if (identityFactPattern.test(normalized)) return "identity_facts";
    if (communicationPattern.test(normalized)) return "communication";
    if (observedKnowledgePattern.test(normalized)) return "observed_knowledge";
    if (evidenceRequirementsPattern.test(normalized)) return "evidence_requirements";
    if (identitySummaryPattern.test(normalized)) return "identity_summary";
    return "unknown";
  }
}

const predictionPattern = /\b(?:who\s+will\s+i\s+marry|when\s+will\s+i\s+die|when\s+will\s+i\s+pass\s+away|lottery\s+numbers?|will\s+i\s+(?:become|be)\s+rich|predict\s+my\s+future|tell\s+me\s+my\s+future|future\s+prediction)\b/i;
const artifactPattern = /\b(?:this|an|the)\s+(?:email|message|artifact|document|resume)|\bdoes\s+(?:this|it).{0,40}\bsound\s+like\s+me\b|\bcompare\b/i;

const hybridAdvicePattern = /\b(?:girlfriend|boyfriend|relationship\s+advice|more\s+disciplined|discipline|manage\s+stress|reduce\s+stress|healthier|become\s+healthy|buy\s+a\s+house|buy\s+a\s+home|move\s+abroad|move\s+to\s+another\s+city|relocate|travel|better\s+leader|leadership|leave\s+my\s+job|switch\s+careers?|change\s+careers?|improve\s+(?:my\s+)?communication|prepare\s+for\s+interviews?|make\s+(?:more\s+)?friends|make\s+friends|personal\s+life)\b/i;

const identityReasoningPattern = /\b(?:should\s+i\s+(?:build|start)\s+(?:my\s+)?start-?up|should\s+i\s+join\s+(?:google|a\s+start-?up|a\s+company)|would\s+entrepreneurship\s+suit\s+me|entrepreneur|founder|higher\s+studies|master'?s|mba|graduate\s+school|startup\s+(?:fit|idea)|career\s+(?:suits?|fit|path)|what\s+career|goal\s+align(?:ment)?|supporting\s+evidence|why\s+(?:do\s+you\s+)?recommend)\b/i;
const identityFactPattern = /\b(?:name|who\s+am\s+i|date\s+of\s+birth|birthday|when\s+was\s+i\s+born|dream|ambition|university|college|school|degree|education|favorite|favourite|cricketer|player|team|project|projects|skill|skills|technology|technologies|goal|goals|current\s+role|timeline|what\s+motivates\s+me|my\s+values|interests)\b/i;
const communicationPattern = /\b(?:communication|communicate|writing|write|email|tone|vocabulary|greeting|signature|sentence|punctuation|style)\b/i;
const observedKnowledgePattern = /\b(?:technology|technologies|skill|skills|domain|expertise|knowledge|know|terms)\b/i;
const evidenceRequirementsPattern = /\b(?:evidence\s+needed|what\s+(?:evidence|information)\s+do\s+you\s+need|missing\s+evidence)\b/i;
const identitySummaryPattern = /\b(?:summarize|summary|about\s+me|identity\s+profile|profile)\b/i;
