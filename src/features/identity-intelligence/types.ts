export type KnowledgeOrigin = "extracted" | "derived" | "awaiting_evidence" | "preview";

export type SourceAvailability = "text_ready" | "coming_soon";
export type SourceKind = "primary" | "connector" | "format";
export type SourceRecordStatus = "ingested" | "ready" | "coming_soon";

export type SourceDefinition = {
  id: string;
  label: string;
  description: string;
  kind: SourceKind;
  availability: SourceAvailability;
  acceptsText?: boolean;
};

export type SourceRecord = {
  id: string;
  sourceId: string;
  label: string;
  status: SourceRecordStatus;
  origin: KnowledgeOrigin;
  addedAt?: string;
  /** Version created by this browser-session source. Historical sources may not have one. */
  genomeVersion?: string;
};

export type IdentityFeatures = {
  vocabulary_richness: number;
  average_sentence_length: number;
  greeting_style: string;
  signature_style: string;
  emoji_frequency: number;
  professional_tone: number;
  preferred_language: string;
  domain_terms: string[];
  average_response_length: number;
  punctuation_habits: Record<string, number>;
};

export type IdentityGenomeResponse = {
  id: string;
  owner_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
};

export type IdentityProfileResponse = {
  identity_genome_id: string;
  sample_count: number;
  unique_token_count: number;
  average_word_count: number;
  embedding_count: number;
  updated_at: string;
  features: IdentityFeatures;
  version: string | null;
};

export type IdentityGenomeVersionResponse = {
  id: string;
  identity_genome_id: string;
  version: string;
  source_label: string;
  source_count: number;
  confidence: number;
  confidence_delta: number | null;
  knowledge_added: string[];
  guardian_observation: string;
  fingerprint: string;
  features: IdentityFeatures;
  created_at: string;
};

export type IntelligenceApiPayload = {
  genome: IdentityGenomeResponse;
  profile?: IdentityProfileResponse;
  versions: IdentityGenomeVersionResponse[];
};

export type KnowledgeObject = {
  id: string;
  title: string;
  value: string;
  description: string;
  category: string;
  origin: KnowledgeOrigin;
  evidenceSources: string[];
  updatedAt?: string;
};

export type GenomeTrait = KnowledgeObject & {
  genomeConfidence?: number;
};

export type GenomeSection = {
  id: string;
  title: string;
  description: string;
  origin: KnowledgeOrigin;
  genomeConfidence?: number;
  evidenceSources: string[];
  lastUpdated?: string;
  traits: GenomeTrait[];
  emptyMessage?: string;
};

export type GuardianInsight = {
  id: string;
  title: string;
  detail: string;
  origin: KnowledgeOrigin;
  updatedAt?: string;
};

export type GenomeTimelineEvent = {
  id: string;
  title: string;
  detail: string;
  timestamp?: string;
  origin: KnowledgeOrigin;
};

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  kind: "genome" | "source" | "knowledge" | "awaiting";
  origin: KnowledgeOrigin;
};

export type KnowledgeGraphEdge = {
  from: string;
  to: string;
};

export type GenomeSnapshot = {
  genome?: IdentityGenomeResponse;
  latestVersion?: IdentityGenomeVersionResponse;
  versions: IdentityGenomeVersionResponse[];
  profile?: IdentityProfileResponse;
  features?: IdentityFeatures;
  sources: SourceRecord[];
  sections: GenomeSection[];
  insights: GuardianInsight[];
  timeline: GenomeTimelineEvent[];
  knowledgeGraph: { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] };
  knowledgeObjects: KnowledgeObject[];
  sourceCount: number;
  genomeConfidence?: number;
  fingerprint?: string;
  hasExtractedKnowledge: boolean;
};

export type GenomeSession = {
  genomeId: string;
  ownerId: string;
  sources: SourceRecord[];
};
