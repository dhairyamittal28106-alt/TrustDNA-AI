from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import NotFoundError
from app.identity.models import IdentityGenome
from app.identity.repository import IdentityGenomeRepository
from app.identity.schemas import CreateIdentityGenomeRequest
from app.shared.ids import uuid7


class IdentityGenomeService:
    def __init__(self, repository: IdentityGenomeRepository) -> None:
        self._repository = repository

    async def create(self, request: CreateIdentityGenomeRequest) -> IdentityGenome:
        now = datetime.now(UTC)
        genome = IdentityGenome(
            id=uuid7(),
            owner_id=request.owner_id,
            display_name=request.display_name,
            created_at=now,
            updated_at=now,
        )
        return await self._repository.add(genome)

    async def get(self, genome_id: UUID) -> IdentityGenome:
        genome = await self._repository.get(genome_id)
        if genome is None:
            raise NotFoundError("Identity Genome", str(genome_id))
        return genome
