from enum import StrEnum


class ArtifactType(StrEnum):
    PLAIN_TEXT = "plain_text"
    EMAIL = "email"
    DOCUMENT = "document"
    RESUME = "resume"
    VOICE = "voice"
    IMAGE = "image"
    CERTIFICATE = "certificate"


class InvestigationStatus(StrEnum):
    QUEUED = "queued"
    INVESTIGATING = "investigating"
    COMPLETED = "completed"
    FAILED = "failed"


class CaseLifecycleState(StrEnum):
    CASE_CREATED = "case_created"
    COLLECTING_EVIDENCE = "collecting_evidence"
    DISPATCHING_AGENTS = "dispatching_agents"
    AWAITING_RESULTS = "awaiting_results"
    AGGREGATING = "aggregating"
    RISK_ANALYSIS = "risk_analysis"
    GENERATING_FINDINGS = "generating_findings"
    GENERATING_CERTIFICATE = "generating_certificate"
    CLOSED = "closed"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Verdict(StrEnum):
    PENDING = "pending"
    AUTHENTIC = "authentic"
    INCONCLUSIVE = "inconclusive"
    IMPERSONATION_CONFIRMED = "impersonation_confirmed"


class AgentName(StrEnum):
    GENESIS = "genesis"
    CIPHER = "cipher"
    CHRONOS = "chronos"
    FORENSIQ = "forensiq"
    SPECTRA = "spectra"
    ATLAS = "atlas"
