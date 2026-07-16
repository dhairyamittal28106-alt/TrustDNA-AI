from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.enums import ArtifactType, InvestigationStatus, RiskLevel, Verdict


class Investigation(BaseModel):
    model_config = ConfigDict(frozen=True)

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
