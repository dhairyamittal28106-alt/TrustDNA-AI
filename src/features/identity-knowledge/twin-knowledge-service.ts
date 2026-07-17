import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import { KnowledgeRetriever } from "@/features/identity-knowledge/knowledge-retriever";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { TwinEvidence, TwinReasoning } from "@/features/identity-twin/types";

export type KnowledgeAnswer = { reasoning: TwinReasoning; evidence: TwinEvidence[] } | null;

/** Answers fact questions before the writing-feature retrieval path. */
export class TwinKnowledgeService {
  constructor(private readonly retriever = new KnowledgeRetriever()) {}

  answer(question: string, snapshot: GenomeSnapshot): KnowledgeAnswer {
    const facts = this.retriever.retrieve(question, snapshot.knowledgeHistory);
    if (!facts.length) return null;

    const evidence = facts.map(toEvidence);
    const answer = renderAnswer(question, facts);
    const confidence = Math.round((facts.reduce((total, fact) => total + fact.provenance.confidence, 0) / facts.length) * 100);
    return {
      evidence,
      reasoning: {
        answer,
        confidence,
        reasoningSummary: ["Selected only the directly relevant structured Identity Knowledge Objects before writing features.", "Every statement is quoted or normalized from direct consented evidence.", "When requested, historical revisions are shown separately from the current active fact."],
        limitations: ["Facts are limited to what was explicitly stated in the analyzed evidence.", "TrustDNA does not infer missing biography, preferences, relationships, or abilities."],
        suggestedSources: [],
      },
    };
  }
}

function toEvidence(fact: IdentityKnowledgeObject): TwinEvidence {
  return {
    id: fact.id,
    title: fact.title,
    detail: `${fact.value}. Evidence: “${fact.provenance.evidence}”`,
    category: fact.category,
    origin: "extracted",
    sources: [fact.provenance.source],
    updatedAt: fact.provenance.timestamp,
  };
}

function renderAnswer(question: string, facts: IdentityKnowledgeObject[]): string {
  const name = facts.find((fact) => fact.factKey === "name");
  const dream = facts.find((fact) => fact.factKey === "dream");
  const university = facts.find((fact) => fact.factKey === "university");
  const favoritePlayer = facts.find((fact) => fact.factKey === "favorite_player");
  const favoritePlayerHistory = facts.filter((fact) => fact.factKey === "favorite_player" && fact.status === "superseded");
  const summary = facts.map((fact) => `${fact.title}: ${fact.value}.`).join("\n");
  if (/\bwho am i\b/i.test(question) && name) return `You are ${name.value}.`;
  if (/\b(dream|ambition)\b/i.test(question) && dream) return `Your dream is ${dream.value}.`;
  if (/\b(where do i (?:study|attend)|university|college)\b/i.test(question) && university) return university.value.endsWith(".") ? university.value : `${university.value}.`;
  if (/\b(favorite|favourite|cricketer|player)\b/i.test(question) && favoritePlayer) {
    const history = favoritePlayerHistory.length ? ` Previously recorded: ${favoritePlayerHistory.map((fact) => fact.value).join(", ")}.` : "";
    return `Your favorite cricketer is ${favoritePlayer.value}.${history}`;
  }
  return `According to your Identity Genome:\n${summary}`;
}
