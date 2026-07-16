from typing import Protocol
from uuid import UUID

from app.identity.models import IdentityGenome


class IdentityGenomeRepository(Protocol):
    async def add(self, genome: IdentityGenome) -> IdentityGenome: ...

    async def get(self, genome_id: UUID) -> IdentityGenome | None: ...


class InMemoryIdentityGenomeRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, IdentityGenome] = {}

    async def add(self, genome: IdentityGenome) -> IdentityGenome:
        self._items[genome.id] = genome
        return genome

    async def get(self, genome_id: UUID) -> IdentityGenome | None:
        return self._items.get(genome_id)
