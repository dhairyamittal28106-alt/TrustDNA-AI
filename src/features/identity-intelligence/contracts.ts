import type {
  GenomeSnapshot,
  IdentityFeatures,
  KnowledgeObject,
  SourceDefinition,
} from "@/features/identity-intelligence/types";

export interface KnowledgeExtractor<Input> {
  extract(input: Input): Promise<KnowledgeObject[]>;
}

export interface GenomeBuilder<Input> {
  build(input: Input): GenomeSnapshot;
}

export interface GenomeStore<Value> {
  load(key: string): Value | null;
  save(key: string, value: Value): void;
  clear(key: string): void;
}

export interface SourceRegistry {
  list(): SourceDefinition[];
  find(id: string): SourceDefinition | undefined;
}

export interface ConnectorRegistry {
  listComingSoon(): SourceDefinition[];
}

export type ExtractedFeatureInput = {
  features: IdentityFeatures;
  evidenceSources: string[];
  updatedAt?: string;
};

/**
 * Converts only deterministic features returned by FastAPI into knowledge
 * objects. It intentionally does not infer values, goals, or personality.
 */
export class DeterministicKnowledgeExtractor implements KnowledgeExtractor<ExtractedFeatureInput> {
  async extract({ features, evidenceSources, updatedAt }: ExtractedFeatureInput): Promise<KnowledgeObject[]> {
    const language = features.preferred_language === "en" ? "English" : features.preferred_language;
    const punctuation = Object.entries(features.punctuation_habits)
      .filter(([, count]) => count > 0)
      .map(([mark, count]) => `${mark} × ${count}`)
      .join(", ") || "No tracked punctuation observed";

    return [
      {
        id: "greeting-style",
        title: "Greeting style",
        value: titleCase(features.greeting_style),
        description: "Observed from analyzed text.",
        category: "communication",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "signature-style",
        title: "Signature style",
        value: titleCase(features.signature_style),
        description: "Observed from analyzed text.",
        category: "communication",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "detected-language",
        title: "Detected language",
        value: language,
        description: "Reported by the current text feature extractor.",
        category: "communication",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "sentence-length",
        title: "Average sentence length",
        value: `${features.average_sentence_length.toFixed(1)} words`,
        description: "Measured from analyzed text.",
        category: "writing",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "response-length",
        title: "Average response length",
        value: `${features.average_response_length.toFixed(0)} words`,
        description: "Measured from analyzed text.",
        category: "writing",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "punctuation-habits",
        title: "Punctuation habits",
        value: punctuation,
        description: "Counts for the punctuation marks tracked by the extractor.",
        category: "writing",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "vocabulary-richness",
        title: "Vocabulary richness",
        value: percent(features.vocabulary_richness),
        description: "Unique-token ratio observed in the current text profile.",
        category: "vocabulary",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "domain-terms",
        title: "Observed domain terms",
        value: features.domain_terms.length ? features.domain_terms.join(", ") : "No domain terms observed yet",
        description: "Observed terms are not represented as verified skills or interests.",
        category: "vocabulary",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "professional-tone",
        title: "Professional-tone signal",
        value: percent(features.professional_tone),
        description: "Deterministic signal from the current text feature extractor.",
        category: "professional",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
      {
        id: "emoji-frequency",
        title: "Emoji frequency",
        value: percent(features.emoji_frequency),
        description: "Observed character frequency in analyzed text.",
        category: "professional",
        origin: "extracted",
        evidenceSources,
        updatedAt,
      },
    ];
  }
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function titleCase(value: string): string {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
