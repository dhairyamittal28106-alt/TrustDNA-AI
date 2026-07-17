from datetime import datetime
from typing import Protocol
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import AgentName, ArtifactType


class InvestigationContext(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    case_id: UUID
    identity_genome_id: UUID
    identity_genome_version: str = "v0"
    identity_vocabulary: set[str] = Field(default_factory=set)
    artifact_type: ArtifactType
    artifact_reference: str = Field(min_length=1, max_length=500)
    artifact_text: str = ""
    metadata: dict[str, str | int | bool] = Field(default_factory=dict)
    investigation_options: dict[str, bool | str] = Field(default_factory=dict)
    requested_by: UUID | None = None
    opened_at: datetime


class EvidenceItem(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    code: str = Field(pattern=r"^[a-z0-9_]+$")
    category: str = Field(min_length=1, max_length=80)
    weight: float = Field(ge=0, le=1)
    source_reference: str = Field(min_length=1, max_length=500)


class Finding(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    code: str = Field(pattern=r"^[a-z0-9_]+$")
    severity: str = Field(pattern=r"^(info|low|medium|high|critical)$")
    evidence_codes: list[str] = Field(default_factory=list)


class AgentResult(BaseModel):
    """The only result format permitted from a forensic agent."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    agent: AgentName
    confidence: float = Field(ge=0, le=1)
    findings: list[Finding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    processing_time_ms: int = Field(ge=0)
    version: str = Field(pattern=r"^v\d+(\.\d+){0,2}$")


class InvestigationAgent(Protocol):
    name: AgentName

    async def investigate(self, context: InvestigationContext) -> AgentResult: ...
