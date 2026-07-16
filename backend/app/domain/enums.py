from enum import StrEnum


class ArtifactType(StrEnum):
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
