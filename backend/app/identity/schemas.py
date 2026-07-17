from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.artifact.models import IdentityProfile


class CreateIdentityGenomeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    owner_id: UUID
    display_name: str = Field(min_length=1, max_length=120)


class IdentityGenomeResponse(BaseModel):
    id: UUID
    owner_id: UUID
    display_name: str
    created_at: datetime
    updated_at: datetime


class IngestTextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=500_000)
    source_label: str = Field(default="text-sample", min_length=1, max_length=120)


class IdentityProfileResponse(BaseModel):
    identity_genome_id: UUID
    sample_count: int
    unique_token_count: int
    average_word_count: float
    embedding_count: int
    updated_at: datetime

    @classmethod
    def from_profile(cls, profile: IdentityProfile) -> "IdentityProfileResponse":
        return cls.model_validate(profile, from_attributes=True)
