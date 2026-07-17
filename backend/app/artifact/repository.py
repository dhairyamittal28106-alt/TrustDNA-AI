from uuid import UUID

from app.artifact.models import Artifact, EmbeddedChunk, IdentityProfile


class InMemoryArtifactRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, Artifact] = {}

    async def add(self, artifact: Artifact) -> Artifact:
        self._items[artifact.id] = artifact
        return artifact


class InMemoryEmbeddingStore:
    def __init__(self) -> None:
        self._items: dict[UUID, list[EmbeddedChunk]] = {}

    async def add(self, identity_genome_id: UUID, chunks: list[EmbeddedChunk]) -> None:
        self._items.setdefault(identity_genome_id, []).extend(chunks)

    async def list_for_genome(self, identity_genome_id: UUID) -> list[EmbeddedChunk]:
        return list(self._items.get(identity_genome_id, []))


class InMemoryIdentityProfileRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, IdentityProfile] = {}

    async def get(self, identity_genome_id: UUID) -> IdentityProfile | None:
        return self._items.get(identity_genome_id)

    async def save(self, profile: IdentityProfile) -> IdentityProfile:
        self._items[profile.identity_genome_id] = profile
        return profile
