from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.artifact.models import IdentityFeatures


class IdentityGenome(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    owner_id: UUID
    display_name: str = Field(min_length=1, max_length=120)
    created_at: datetime
    updated_at: datetime


class IdentityGenomeVersion(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    id: UUID
    identity_genome_id: UUID
    version: str
    source_count: int = Field(ge=0)
    confidence: float = Field(ge=0, le=1)
    fingerprint: str
    features: IdentityFeatures
    created_at: datetime
