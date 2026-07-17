import type { IdentityFeatures, IdentityGenomeVersionResponse } from "@/features/identity-intelligence/types";
import type { GenomeChange, GenomeDiff } from "@/features/identity-evolution/types";

export class GenomeDiffEngine {
  compare(previous: IdentityGenomeVersionResponse | undefined, current: IdentityGenomeVersionResponse): GenomeDiff {
    const currentConfidence = asPercent(current.confidence);
    const previousConfidence = previous ? asPercent(previous.confidence) : undefined;
    const sourceDelta = current.source_count - (previous?.source_count ?? 0);

    if (!previous) {
      return {
        to: current,
        sourceDelta,
        observedKnowledgeAdded: [...current.knowledge_added],
        observedKnowledgeRemoved: [],
        confidence: { current: currentConfidence },
        changes: [
          {
            id: "initial-source-coverage",
            kind: "added",
            category: "source_coverage",
            label: "Initial analyzed source coverage recorded",
            detail: `${current.source_count} analyzed ${current.source_count === 1 ? "source" : "sources"} created the baseline Genome version.`,
          },
          ...initialKnowledgeChanges(current.knowledge_added),
        ],
        limitations: ["This baseline represents the current/latest text-feature snapshot, not a complete identity profile."],
      };
    }

    const observedKnowledgeAdded = current.knowledge_added;
    const observedKnowledgeRemoved = previous.features.domain_terms.filter((term) => !current.features.domain_terms.includes(term));
    const confidenceDelta = current.confidence_delta ?? (currentConfidence - (previousConfidence ?? currentConfidence));
    const changes = [
      sourceDelta !== 0 ? {
        id: "source-coverage-delta",
        kind: sourceDelta > 0 ? "added" as const : "removed" as const,
        category: "source_coverage" as const,
        label: sourceDelta > 0 ? "Analyzed source coverage increased" : "Analyzed source coverage decreased",
        detail: `${signed(sourceDelta)} source${Math.abs(sourceDelta) === 1 ? "" : "s"}; ${current.source_count} current analyzed ${current.source_count === 1 ? "source" : "sources"}.`,
      } : undefined,
      ...observedKnowledgeChanges(observedKnowledgeAdded, observedKnowledgeRemoved),
      ...featureChanges(previous.features, current.features),
    ].filter((change): change is GenomeChange => Boolean(change));

    return {
      from: previous,
      to: current,
      sourceDelta,
      observedKnowledgeAdded,
      observedKnowledgeRemoved,
      confidence: { previous: previousConfidence, current: currentConfidence, delta: confidenceDelta },
      changes,
      limitations: [
        "Confidence is the current backend’s deterministic source-count coverage heuristic, not a statistical truth score.",
        "Feature comparisons describe current/latest text snapshots and do not establish behavior, skills, goals, or preferences.",
      ],
    };
  }
}

function initialKnowledgeChanges(knowledgeAdded: string[]): GenomeChange[] {
  return knowledgeAdded.length ? [{
    id: "initial-observed-domain-terms",
    kind: "added",
    category: "observed_knowledge",
    label: "Observed domain terms recorded",
    detail: `${knowledgeAdded.join(", ")} were observed in the current/latest text feature snapshot. They are not verified skills.`,
  }] : [];
}

function observedKnowledgeChanges(added: string[], removed: string[]): GenomeChange[] {
  const changes: GenomeChange[] = [];
  if (added.length) changes.push({ id: "observed-terms-added", kind: "added", category: "observed_knowledge", label: "New observed domain terms", detail: `${added.join(", ")} appeared in the current/latest text feature snapshot.` });
  if (removed.length) changes.push({ id: "observed-terms-removed", kind: "removed", category: "observed_knowledge", label: "Observed domain terms no longer present", detail: `${removed.join(", ")} were not present in the current/latest text feature snapshot.` });
  return changes;
}

function featureChanges(previous: IdentityFeatures, current: IdentityFeatures): GenomeChange[] {
  const changes: GenomeChange[] = [];
  if (previous.greeting_style !== current.greeting_style || previous.signature_style !== current.signature_style) {
    changes.push({ id: "communication-style-updated", kind: "updated", category: "communication", label: "Communication markers updated", detail: `Greeting: ${previous.greeting_style} → ${current.greeting_style}. Signature: ${previous.signature_style} → ${current.signature_style}.` });
  }
  if (previous.average_sentence_length !== current.average_sentence_length || previous.average_response_length !== current.average_response_length || previous.vocabulary_richness !== current.vocabulary_richness) {
    changes.push({ id: "writing-snapshot-updated", kind: "updated", category: "writing", label: "Writing feature snapshot updated", detail: `Sentence length ${formatNumber(previous.average_sentence_length)} → ${formatNumber(current.average_sentence_length)} · response length ${formatNumber(previous.average_response_length)} → ${formatNumber(current.average_response_length)} · vocabulary richness ${formatNumber(previous.vocabulary_richness)} → ${formatNumber(current.vocabulary_richness)}.` });
  }
  if (previous.professional_tone !== current.professional_tone || previous.emoji_frequency !== current.emoji_frequency) {
    changes.push({ id: "professional-signal-updated", kind: "updated", category: "professional", label: "Professional communication signals updated", detail: `Professional-tone signal ${formatNumber(previous.professional_tone)} → ${formatNumber(current.professional_tone)} · emoji frequency ${formatNumber(previous.emoji_frequency)} → ${formatNumber(current.emoji_frequency)}.` });
  }
  return changes;
}

function asPercent(value: number): number {
  return Math.round(value * 100);
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
