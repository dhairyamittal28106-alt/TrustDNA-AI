import hashlib
from uuid import UUID

from app.artifact.models import IdentityProfile
from app.identity.models import IdentityGenomeVersion
from app.identity.repository import InMemoryIdentityGenomeVersionRepository
from app.shared.ids import uuid7


class IdentityGenomeVersionService:
    def __init__(self, repository: InMemoryIdentityGenomeVersionRepository) -> None:
        self._repository = repository

    async def record(self, genome_id: UUID, profile: IdentityProfile) -> IdentityGenomeVersion:
        previous = await self._repository.latest(genome_id)
        number = (int(previous.version.removeprefix("v")) + 1) if previous else 1
        payload = profile.features.model_dump_json().encode()
        fingerprint = hashlib.sha256(payload).hexdigest()[:24]
        version = IdentityGenomeVersion(
            id=uuid7(),
            identity_genome_id=genome_id,
            version=f"v{number}",
            source_count=profile.sample_count,
            confidence=min(1.0, round(0.5 + (profile.sample_count * 0.1), 4)),
            fingerprint=fingerprint,
            features=profile.features,
            created_at=profile.updated_at,
        )
        return await self._repository.add(version)

    async def list(self, genome_id: UUID) -> list[IdentityGenomeVersion]:
        return await self._repository.list_for_genome(genome_id)

    async def latest_version(self, genome_id: UUID) -> str:
        latest = await self._repository.latest(genome_id)
        return latest.version if latest else "v0"
