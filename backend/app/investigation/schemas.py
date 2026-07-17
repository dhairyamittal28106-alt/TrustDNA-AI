from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.agents.contracts import AgentResult
from app.certificate.schemas import CertificateResponse
from app.domain.enums import ArtifactType, InvestigationStatus, RiskLevel, Verdict
from app.investigation.models import LifecycleEvent
from app.investigation.risk import RiskAssessment


class CreateInvestigationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identity_genome_id: UUID
    artifact_type: ArtifactType
    artifact_reference: str = Field(min_length=1, max_length=500)


class InvestigationResponse(BaseModel):
    id: UUID
    case_number: str
    identity_genome_id: UUID
    artifact_type: ArtifactType
    artifact_reference: str
    genome_version: str
    status: InvestigationStatus
    lifecycle_state: str
    timeline: list[LifecycleEvent]
    verdict: Verdict
    risk_level: RiskLevel | None
    opened_at: datetime
    updated_at: datetime


class RunTextInvestigationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=500_000)


class InvestigationRunResponse(BaseModel):
    investigation: InvestigationResponse
    agents: list[AgentResult]
    risk: RiskAssessment
    certificate: CertificateResponse
