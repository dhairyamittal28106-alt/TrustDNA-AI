import hashlib
from uuid import UUID

from app.artifact.models import IdentityProfile
from app.identity.models import IdentityGenomeVersion
from app.identity.repository import InMemoryIdentityGenomeVersionRepository
from app.shared.ids import uuid7


class IdentityGenomeVersionService:
    def __init__(self, repository: InMemoryIdentityGenomeVersionRepository) -> None:
        self._repository = repository

    async def record(
        self, genome_id: UUID, profile: IdentityProfile, source_label: str
    ) -> IdentityGenomeVersion:
        previous = await self._repository.latest(genome_id)
        number = (int(previous.version.removeprefix("v")) + 1) if previous else 1
        payload = profile.features.model_dump_json().encode()
        fingerprint = hashlib.sha256(payload).hexdigest()[:24]
        confidence = min(1.0, round(0.5 + (profile.sample_count * 0.1), 4))
        knowledge_added = [
            term
            for term in profile.features.domain_terms
            if term not in (previous.features.domain_terms if previous else [])
        ]
        confidence_delta = round(confidence - previous.confidence, 4) if previous else None
        version = IdentityGenomeVersion(
            id=uuid7(),
            identity_genome_id=genome_id,
            version=f"v{number}",
            source_label=source_label,
            source_count=profile.sample_count,
            confidence=confidence,
            confidence_delta=confidence_delta,
            knowledge_added=knowledge_added,
            guardian_observation=self._guardian_observation(
                previous=previous,
                knowledge_added=knowledge_added,
                confidence_delta=confidence_delta,
            ),
            fingerprint=fingerprint,
            features=profile.features,
            created_at=profile.updated_at,
        )
        return await self._repository.add(version)

    @staticmethod
    def _guardian_observation(
        previous: IdentityGenomeVersion | None,
        knowledge_added: list[str],
        confidence_delta: float | None,
    ) -> str:
        if previous is None:
            return "Guardian established an evidence-bound baseline from analyzed text."
        observations: list[str] = []
        if knowledge_added:
            observations.append(
                f"recorded {len(knowledge_added)} newly observed domain term"
                f"{'s' if len(knowledge_added) != 1 else ''}"
            )
        if confidence_delta is not None and confidence_delta != 0:
            observations.append(
                f"coverage changed {'up' if confidence_delta > 0 else 'down'} "
                f"{abs(round(confidence_delta * 100))} points"
            )
        return (
            f"Guardian updated the version: {'; '.join(observations)}."
            if observations
            else "Guardian recorded a new version with no additional explainable delta."
        )

    async def list(self, genome_id: UUID) -> list[IdentityGenomeVersion]:
        return await self._repository.list_for_genome(genome_id)

    async def latest_version(self, genome_id: UUID) -> str:
        latest = await self._repository.latest(genome_id)
        return latest.version if latest else "v0"
