import { DeterministicKnowledgeExtractor } from "@/features/identity-intelligence/contracts";
import { KnowledgeVersionManager } from "@/features/identity-knowledge/knowledge-version-manager";
import type { IdentityKnowledgeObject } from "@/features/identity-knowledge/types";
import type {
  GenomeSection,
  GenomeSnapshot,
  GuardianInsight,
  IdentityFeatures,
  IntelligenceApiPayload,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeOrigin,
  KnowledgeObject,
  SourceRecord,
} from "@/features/identity-intelligence/types";

const pendingCategories = [
  { id: "behavior", title: "Behavioral Traits", detail: "Behavioral evidence is collected only from supported, consented sources.", traits: ["Behavior profile", "Emotional tone", "Creativity"] },
  { id: "decision", title: "Decision Profile", detail: "Decision and leadership patterns need dedicated evidence before they can be shown.", traits: ["Decision patterns", "Leadership style", "Learning style", "Work preferences"] },
  { id: "values", title: "Values, Interests & Relationships", detail: "TrustDNA does not infer values, interests, or relationships without direct, explainable evidence.", traits: ["Core values", "Interests", "Relationship style", "Long-term goals"] },
  { id: "timeline", title: "Life Timeline", detail: "Milestones require a future timeline extractor and source-level provenance.", traits: ["Life milestones", "Risk profile"] },
] as const;

export async function buildGenomeSnapshot(payload: IntelligenceApiPayload | undefined, sources: SourceRecord[], knowledgeHistory: IdentityKnowledgeObject[] = []): Promise<GenomeSnapshot> {
  if (!payload) return emptyGenomeSnapshot(sources, knowledgeHistory);

  const latestVersion = payload.versions[payload.versions.length - 1];
  const features = payload.profile?.features ?? latestVersion?.features;
  const sourceCount = payload.profile?.sample_count ?? latestVersion?.source_count ?? sources.length;
  const confidence = latestVersion ? Math.round(latestVersion.confidence * 100) : undefined;
  const updatedAt = payload.profile?.updated_at ?? latestVersion?.created_at;
  const evidenceSources = sources.length
    ? sources.filter((source) => source.status === "ingested").map((source) => source.label)
    : Array.from({ length: sourceCount }, (_, index) => `Analyzed text source ${index + 1}`);

  if (!features) {
    return {
      ...emptyGenomeSnapshot(sources, knowledgeHistory),
      genome: payload.genome,
      latestVersion,
      versions: payload.versions,
      profile: payload.profile,
      sourceCount,
      genomeConfidence: confidence,
      fingerprint: latestVersion?.fingerprint,
    };
  }

  const featureKnowledge = await new DeterministicKnowledgeExtractor().extract({ features, evidenceSources, updatedAt });
  const identityFacts = knowledgeHistory.filter((fact) => fact.status === "active");
  const knowledgeObjects = [...identityFacts.map(toKnowledgeObject), ...featureKnowledge];
  const sections = buildSections(knowledgeObjects, identityFacts, confidence, evidenceSources, updatedAt);
  const insights = buildInsights(features, latestVersion?.version, confidence, sourceCount, updatedAt, identityFacts);
  const timeline = [...buildTimeline(payload, evidenceSources), ...new KnowledgeVersionManager().timeline(knowledgeHistory)]
    .sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
  const knowledgeGraph = buildKnowledgeGraph(knowledgeObjects, identityFacts, evidenceSources);

  return {
    genome: payload.genome,
    latestVersion,
    versions: payload.versions,
    profile: payload.profile,
    features,
    sources,
    sections,
    insights,
    timeline,
    knowledgeGraph,
    knowledgeObjects,
    identityFacts,
    knowledgeHistory,
    sourceCount,
    genomeConfidence: confidence,
    fingerprint: latestVersion?.fingerprint,
    hasExtractedKnowledge: true,
  };
}

export function emptyGenomeSnapshot(sources: SourceRecord[] = [], knowledgeHistory: IdentityKnowledgeObject[] = []): GenomeSnapshot {
  const pendingSections = buildPendingSections();
  return {
    sources,
    versions: [],
    sections: [
      {
        id: "communication",
        title: "Communication Profile",
        description: "A supported text source is required before TrustDNA can show communication traits.",
        origin: "awaiting_evidence",
        evidenceSources: [],
        traits: [],
        emptyMessage: "No communication evidence collected yet.",
      },
      {
        id: "writing",
        title: "Writing Style",
        description: "Writing features appear only after a consented text source is analyzed.",
        origin: "awaiting_evidence",
        evidenceSources: [],
        traits: [],
        emptyMessage: "No writing evidence collected yet.",
      },
      {
        id: "knowledge",
        title: "Vocabulary & Observed Knowledge",
        description: "Observed terms are shown as evidence, never promoted to skills without a dedicated verifier.",
        origin: "awaiting_evidence",
        evidenceSources: [],
        traits: [],
        emptyMessage: "No vocabulary or observed-knowledge evidence collected yet.",
      },
      ...pendingSections,
    ],
    insights: [
      {
        id: "guardian-awaiting-source",
        title: "Guardian awaiting a supported source",
        detail: "No personal communication, behavior, or decision claim is shown until a consented source is analyzed.",
        origin: "awaiting_evidence",
      },
      {
        id: "guardian-preview",
        title: "Future intelligence preview",
        detail: "Leadership, timeline, and connector insights appear only when their dedicated extractors return evidence.",
        origin: "preview",
      },
    ],
    timeline: [],
    knowledgeGraph: {
      nodes: [
        { id: "genome", label: "Identity Genome", kind: "genome", origin: "awaiting_evidence" },
        { id: "source", label: "Awaiting source", kind: "awaiting", origin: "awaiting_evidence" },
      ],
      edges: [{ from: "genome", to: "source" }],
    },
    knowledgeObjects: [],
    identityFacts: knowledgeHistory.filter((fact) => fact.status === "active"),
    knowledgeHistory,
    sourceCount: 0,
    hasExtractedKnowledge: false,
  };
}

function buildSections(knowledgeObjects: KnowledgeObject[], identityFacts: IdentityKnowledgeObject[], confidence: number | undefined, evidenceSources: string[], updatedAt: string | undefined): GenomeSection[] {
  const sectionDefinitions = [
    { id: "communication", title: "Communication Profile", description: "Greeting, signature, and language facts observed from analyzed text." },
    { id: "writing", title: "Writing Style", description: "Measured sentence, response, and punctuation signals from analyzed text." },
    { id: "vocabulary", title: "Vocabulary & Observed Knowledge", description: "Measured vocabulary and observed domain terms. These are not verified skills or interests." },
    { id: "professional", title: "Professional Communication", description: "Deterministic tone and expression signals from analyzed text." },
  ];

  const identityFactSection: GenomeSection = {
    id: "identity-facts",
    title: "Identity Facts",
    description: "Direct statements extracted from consented evidence. Each fact keeps its source, version, confidence, and evidence excerpt.",
    origin: identityFacts.length ? "extracted" : "awaiting_evidence",
    genomeConfidence: confidence,
    evidenceSources: identityFacts.map((fact) => fact.provenance.source),
    lastUpdated: identityFacts[0]?.provenance.timestamp,
    traits: knowledgeObjects.filter((knowledge) => knowledge.category === "identity-facts").map((knowledge) => ({ ...knowledge, genomeConfidence: confidence })),
    emptyMessage: "No directly stated identity facts have been extracted yet.",
  };

  const extracted = sectionDefinitions.map((section) => ({
    ...section,
    origin: "extracted" as const,
    genomeConfidence: confidence,
    evidenceSources,
    lastUpdated: updatedAt,
    traits: knowledgeObjects.filter((knowledge) => knowledge.category === section.id).map((knowledge) => ({ ...knowledge, genomeConfidence: confidence })),
  }));

  return [identityFactSection, ...extracted, ...buildPendingSections()];
}

function buildPendingSections(): GenomeSection[] {
  return pendingCategories.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.detail,
    origin: "awaiting_evidence",
    evidenceSources: [],
    traits: section.traits.map((title) => ({
      id: `${section.id}-${slugify(title)}`,
      title,
      value: "Awaiting evidence",
      description: "This capability stays empty until a supported extractor provides explainable evidence.",
      category: section.id,
      origin: "awaiting_evidence",
      evidenceSources: [],
    })),
    emptyMessage: "No supported evidence collected yet.",
  }));
}

function buildInsights(features: IdentityFeatures, version: string | undefined, confidence: number | undefined, sourceCount: number, updatedAt: string | undefined, identityFacts: IdentityKnowledgeObject[]): GuardianInsight[] {
  const insights: GuardianInsight[] = [
    {
      id: "communication-updated",
      title: "Communication profile updated",
      detail: `${version ?? "Current genome"} now reflects ${sourceCount} analyzed text ${sourceCount === 1 ? "source" : "sources"}.`,
      origin: "derived",
      updatedAt,
    },
    {
      id: "writing-confidence",
      title: "Writing style confidence available",
      detail: confidence === undefined ? "A genome-level confidence will appear with the next version." : `Current genome-level confidence is ${confidence}%.`,
      origin: "derived",
      updatedAt,
    },
  ];

  if (features.domain_terms.length) {
    insights.push({
      id: "observed-domain-terms",
      title: "Observed knowledge terms refreshed",
      detail: `${features.domain_terms.slice(0, 4).join(", ")} ${features.domain_terms.length > 4 ? "and more" : ""} were observed in the latest text evidence.`,
      origin: "derived",
      updatedAt,
    });
  }

  if (identityFacts.length) {
    insights.unshift({
      id: "identity-facts-refreshed",
      title: "Structured Identity Facts refreshed",
      detail: `${identityFacts.length} direct fact${identityFacts.length === 1 ? " is" : "s are"} active in the current Identity Genome.`,
      origin: "extracted",
      updatedAt: identityFacts[0]?.provenance.timestamp,
    });
  }

  return insights;
}

function buildTimeline(payload: IntelligenceApiPayload, evidenceSources: string[]) {
  const events = payload.versions.map((version) => ({
    id: version.id,
    title: `Genome ${version.version} recorded`,
    detail: `${version.source_count} analyzed ${version.source_count === 1 ? "source" : "sources"} · ${Math.round(version.confidence * 100)}% genome confidence`,
    timestamp: version.created_at,
    origin: "extracted" as KnowledgeOrigin,
  }));

  if (payload.profile?.updated_at) {
    events.push({
      id: `profile-${payload.profile.updated_at}`,
      title: "Text evidence processed",
      detail: evidenceSources.length ? evidenceSources.join(", ") : "Current text source",
      timestamp: payload.profile.updated_at,
      origin: "extracted" as KnowledgeOrigin,
    });
  }

  return events.sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
}

function buildKnowledgeGraph(knowledgeObjects: KnowledgeObject[], identityFacts: IdentityKnowledgeObject[], evidenceSources: string[]) {
  const nodes: KnowledgeGraphNode[] = [{ id: "genome", label: "Identity Genome", kind: "genome", origin: "derived" }];
  const edges: KnowledgeGraphEdge[] = [];

  evidenceSources.forEach((source, index) => {
    const id = `source-${index}`;
    nodes.push({ id, label: source, kind: "source", origin: "extracted" });
    edges.push({ from: "genome", to: id });
  });

  const categories = Array.from(new Set([...knowledgeObjects.map((knowledge) => knowledge.category), ...identityFacts.map((fact) => fact.category)]));
  categories.forEach((category) => {
    const id = `knowledge-${category}`;
    nodes.push({ id, label: titleCase(category), kind: "knowledge", origin: "extracted" });
    edges.push({ from: "genome", to: id });
  });

  return { nodes, edges };
}

function toKnowledgeObject(fact: IdentityKnowledgeObject): KnowledgeObject {
  return {
    id: fact.id,
    title: fact.title,
    value: fact.value,
    description: `${fact.description} Evidence: “${fact.provenance.evidence}” · ${fact.provenance.version}.`,
    category: "identity-facts",
    origin: "extracted",
    evidenceSources: [fact.provenance.source],
    updatedAt: fact.provenance.timestamp,
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function titleCase(value: string): string {
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
