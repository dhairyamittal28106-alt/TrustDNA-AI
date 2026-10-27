export type IdentityKnowledgeCategory =
  | "identity"
  | "education"
  | "career"
  | "projects"
  | "skills"
  | "goals"
  | "sports"
  | "technologies"
  | "timeline"
  | "relationships"
  | "interests"
  | "values"
  | "motivations";

export type KnowledgeFactStatus = "active" | "superseded";

export type KnowledgeProvenance = {
  source: string;
  evidence: string;
  version: string;
  timestamp: string;
  confidence: number;
};

 
export type IdentityKnowledgeObject = {
  id: string;
  factKey: string;
  title: string;
  value: string;
  category: IdentityKnowledgeCategory;
  description: string;
  status: KnowledgeFactStatus;
  provenance: KnowledgeProvenance;
};

export type KnowledgeExtractionInput = {
  content: string;
  sourceLabel: string;
  genomeVersion: string;
  timestamp: string;
};

export type KnowledgeMergeResult = {
  objects: IdentityKnowledgeObject[];
  added: IdentityKnowledgeObject[];
  updated: Array<{ previous: IdentityKnowledgeObject; current: IdentityKnowledgeObject }>;
};
