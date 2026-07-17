export type AgentName = "genesis" | "cipher" | "chronos" | "forensiq" | "spectra" | "atlas";

export type Scenario = {
  id: "fake-ceo-email" | "cloned-voice" | "forged-resume" | "fake-certificate";
  title: string;
  subject: string;
  artifactReference: string;
  candidateText: string;
  seedText: string;
  icon: "mail" | "mic" | "file" | "certificate";
};

export type AgentResult = {
  agent: AgentName;
  confidence: number;
  findings: { code: string; severity: string; evidence_codes: string[] }[];
  limitations: string[];
  evidence: { code: string; category: string; weight: number; source_reference: string }[];
  processing_time_ms: number;
  version: string;
};

export type InvestigationResult = {
  investigation: {
    id: string;
    case_number: string;
    identity_genome_id: string;
    genome_version: string;
    artifact_type: string;
    artifact_reference: string;
    status: string;
    lifecycle_state: string;
    timeline: { state: string; occurred_at: string; details: Record<string, string> }[];
    verdict: "authentic" | "inconclusive" | "impersonation_confirmed";
    risk_level: "low" | "medium" | "high" | "critical";
  };
  agents: AgentResult[];
  risk: {
    risk_level: string;
    verdict: string;
    confidence: number;
    rationale_codes: string[];
    breakdown: { writing: number; behavior: number; metadata: number; timeline: number; semantic: number; weighted_score: number };
  };
  certificate: {
    id: string;
    certificate_number: string;
    identity_genome_id: string;
    investigation_id: string;
    identity_confidence: number;
    trust_rating: string;
    issued_at: string;
  };
};
