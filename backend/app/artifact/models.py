from __future__ import annotations

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
    evidence_features: EvidenceFeatures | None = None
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
    features: IdentityFeatures
    updated_at: datetime


class EvidenceFeatures(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    all_caps_ratio: float = Field(ge=0, le=1)
    exclamation_count: int = Field(ge=0)
    financial_request: bool
    credential_request: bool
    suspicious_domain: bool
    threat_language: bool
    greeting_style: str


class IdentityFeatures(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    vocabulary_richness: float = Field(ge=0, le=1)
    average_sentence_length: float = Field(ge=0)
    greeting_style: str
    signature_style: str
    emoji_frequency: float = Field(ge=0)
    professional_tone: float = Field(ge=0, le=1)
    preferred_language: str = "en"
    domain_terms: list[str] = Field(default_factory=list)
    average_response_length: float = Field(ge=0)
    punctuation_habits: dict[str, int] = Field(default_factory=dict)
