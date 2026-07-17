from datetime import UTC, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import ArtifactType


class Artifact(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    id: UUID
    owner_id: UUID
    content: str = Field(min_length=1)
    media_type: str = "text/plain"
    artifact_type: ArtifactType = ArtifactType.PLAIN_TEXT
    source_label: str = Field(default="text-sample", max_length=120)
    extracted_text: str | None = None
    normalized_text: str | None = None
    redacted_text: str | None = None
    metadata: dict[str, str | int | bool] = Field(default_factory=dict)
    chunks: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class EmbeddedChunk(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    artifact_id: UUID
    chunk_index: int = Field(ge=0)
    text: str
    vector: list[float]


class IdentityProfile(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    identity_genome_id: UUID
    sample_count: int = Field(ge=0)
    unique_token_count: int = Field(ge=0)
    average_word_count: float = Field(ge=0)
    embedding_count: int = Field(ge=0)
    vocabulary: set[str] = Field(default_factory=set)
    updated_at: datetime
