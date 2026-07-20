import type { GenomeSnapshot } from "@/features/identity-intelligence/types";
import { mergeEvidence } from "@/features/identity-intelligence/evidence-merge";
import { classifyKnowledgeRetrievalIntent, KnowledgeRetriever, type KnowledgeRetrievalIntent } from "@/features/identity-knowledge/knowledge-retriever";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type { TwinEvidence, TwinReasoning } from "@/features/identity-twin/types";

export type KnowledgeAnswer = { reasoning: TwinReasoning; evidence: TwinEvidence[] } | null;

/** Answers fact questions before the writing-feature retrieval path. */
export class TwinKnowledgeService {
  constructor(private readonly retriever = new KnowledgeRetriever()) {}

  intentFor(question: string): KnowledgeRetrievalIntent {
    return classifyKnowledgeRetrievalIntent(question);
  }

  answer(question: string, snapshot: GenomeSnapshot): KnowledgeAnswer {
    const facts = this.retriever.retrieve(question, snapshot.knowledgeHistory);
    if (!facts.length) return null;

    const evidence = mergeEvidence("selectedEvidence", facts.map(toEvidence));
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

  unavailable(question: string): TwinReasoning {
    const intent = this.intentFor(question);
    const label = intent === "unknown" ? "that information" : intent.replace(/_/g, " ");
    return {
      answer: `There is no directly stated ${label} fact in your current Identity Genome. TrustDNA will not substitute communication, behavioral, or unrelated evidence.`,
      confidence: null,
      reasoningSummary: ["Classified the question into a single direct-knowledge category.", "No active Knowledge Object exists for that category, so no unrelated evidence was retrieved."],
      limitations: ["TrustDNA answers direct identity questions only from normalized, explicitly stated Knowledge Objects."],
      suggestedSources: ["Add a consented Personal Notes statement for this category."],
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
  const intent = classifyKnowledgeRetrievalIntent(question);
  const name = facts.find((fact) => fact.factKey === "name");
  const dateOfBirth = facts.find((fact) => fact.factKey === "date_of_birth");
  const dream = facts.filter((fact) => fact.factKey === "dream");
  const university = facts.find((fact) => fact.factKey === "university");
  const degree = facts.find((fact) => fact.factKey === "degree");
  const department = facts.find((fact) => fact.factKey === "department");
  const favoritePlayer = facts.find((fact) => fact.factKey === "favorite_player");
  const favoritePlayerHistory = facts.filter((fact) => fact.factKey === "favorite_player" && fact.status === "superseded");
  const summary = facts.map((fact) => `${fact.title}: ${fact.value}.`).join("\n");
  if (/\bwho am i\b/i.test(question) && name) return `You are ${name.value}.`;
  if (intent === "date_of_birth" && dateOfBirth) return `Your date of birth is ${dateOfBirth.value}.`;
  if (intent === "dreams" && dream.length) return `Your recorded dream${dream.length === 1 ? " is" : "s are"}: ${dream.map((fact) => fact.value).join("; ")}.`;
  if (/\b(where do i (?:study|attend)|university|college)\b/i.test(question) && university) return university.value.endsWith(".") ? university.value : `${university.value}.`;
  if (intent === "degree" && degree) return `${degree.value}${department ? ` in ${department.value}` : ""}.`;
  if (intent === "motivation") return `Your recorded motivation${facts.length === 1 ? " is" : "s are"}: ${facts.map((fact) => fact.value).join("; ")}.`;
  if (intent === "values") return `Your recorded value${facts.length === 1 ? " is" : "s are"}: ${facts.map((fact) => fact.value).join("; ")}.`;
  if (intent === "projects") return `Your recorded project${facts.length === 1 ? " is" : "s are"}: ${facts.map((fact) => fact.value).join("; ")}.`;
  if (intent === "technical_skills") return `Your recorded technologies: ${facts.map((fact) => fact.value).join(", ")}.`;
  if (/\b(favorite|favourite|cricketer|player)\b/i.test(question) && favoritePlayer) {
    const history = favoritePlayerHistory.length ? ` Previously recorded: ${favoritePlayerHistory.map((fact) => fact.value).join(", ")}.` : "";
    return `Your favorite cricketer is ${favoritePlayer.value}.${history}`;
  }
  return `According to your Identity Genome:\n${summary}`;
}
