from datetime import UTC, datetime
from uuid import UUID

from app.artifact.contracts import EmbeddingProvider
from app.artifact.models import Artifact, EmbeddedChunk, IdentityProfile
from app.artifact.pipeline import ArtifactPipeline
from app.artifact.processors import identity_features, tokens
from app.artifact.repository import (
    InMemoryArtifactRepository,
    InMemoryEmbeddingStore,
    InMemoryIdentityProfileRepository,
)
from app.shared.ids import uuid7


class ArtifactIngestionService:
    def __init__(
        self,
        pipeline: ArtifactPipeline,
        embedding_provider: EmbeddingProvider,
        artifacts: InMemoryArtifactRepository,
        embeddings: InMemoryEmbeddingStore,
        profiles: InMemoryIdentityProfileRepository,
    ) -> None:
        self._pipeline = pipeline
        self._embedding_provider = embedding_provider
        self._artifacts = artifacts
        self._embeddings = embeddings
        self._profiles = profiles

    async def ingest_text(
        self, owner_id: UUID, identity_genome_id: UUID, content: str, source_label: str
    ) -> IdentityProfile:
        artifact = await self.process_text(owner_id, content, source_label)
        await self._artifacts.add(artifact)
        vectors = await self._embedding_provider.embed(artifact.chunks)
        await self._embeddings.add(
            identity_genome_id,
            [
                EmbeddedChunk(artifact_id=artifact.id, chunk_index=index, text=text, vector=vector)
                for index, (text, vector) in enumerate(zip(artifact.chunks, vectors, strict=True))
            ],
        )
        profile = await self._profiles.get(identity_genome_id)
        words = (artifact.redacted_text or "").split()
        vocabulary = (profile.vocabulary if profile else set()) | tokens(
            artifact.redacted_text or ""
        )
        updated = IdentityProfile(
            identity_genome_id=identity_genome_id,
            sample_count=(profile.sample_count if profile else 0) + 1,
            unique_token_count=len(vocabulary),
            average_word_count=(
                (profile.average_word_count * profile.sample_count if profile else 0) + len(words)
            )
            / ((profile.sample_count if profile else 0) + 1),
            embedding_count=(profile.embedding_count if profile else 0) + len(vectors),
            vocabulary=vocabulary,
            features=identity_features(artifact.redacted_text or ""),
            updated_at=datetime.now(UTC),
        )
        return await self._profiles.save(profile=updated)

    async def process_text(self, owner_id: UUID, content: str, source_label: str) -> Artifact:
        return await self._pipeline.run(
            Artifact(id=uuid7(), owner_id=owner_id, content=content, source_label=source_label)
        )

    async def get_profile(self, identity_genome_id: UUID) -> IdentityProfile | None:
        return await self._profiles.get(identity_genome_id)
