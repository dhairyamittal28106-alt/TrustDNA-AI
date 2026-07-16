from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import ArtifactType, InvestigationStatus, RiskLevel, Verdict


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
    status: InvestigationStatus
    verdict: Verdict
    risk_level: RiskLevel | None
    opened_at: datetime
    updated_at: datetime
