from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    ArtifactType,
    CaseLifecycleState,
    InvestigationStatus,
    RiskLevel,
    Verdict,
)


class LifecycleEvent(BaseModel):
    state: CaseLifecycleState
    occurred_at: datetime
    details: dict[str, str] = Field(default_factory=dict)


class Investigation(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    case_number: str
    identity_genome_id: UUID
    artifact_type: ArtifactType
    artifact_reference: str
    genome_version: str
    status: InvestigationStatus
    lifecycle_state: CaseLifecycleState
    timeline: list[LifecycleEvent] = Field(default_factory=list)
    verdict: Verdict
    risk_level: RiskLevel | None
    opened_at: datetime
    updated_at: datetime
