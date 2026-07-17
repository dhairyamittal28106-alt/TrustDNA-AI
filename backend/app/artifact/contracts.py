from typing import Protocol
from uuid import UUID

from app.artifact.models import Artifact, EmbeddedChunk, IdentityProfile


class ArtifactProcessor(Protocol):
    async def process(self, artifact: Artifact) -> Artifact: ...


class EmbeddingProvider(Protocol):
    dimension: int

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class EmbeddingStore(Protocol):
    async def add(self, chunks: list[EmbeddedChunk]) -> None: ...

    async def list_for_genome(self, identity_genome_id: UUID) -> list[EmbeddedChunk]: ...


class IdentityProfileRepository(Protocol):
    async def get(self, identity_genome_id: UUID) -> IdentityProfile | None: ...

    async def save(self, profile: IdentityProfile) -> IdentityProfile: ...
