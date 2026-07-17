from typing import Protocol
from uuid import UUID

from app.identity.models import IdentityGenome, IdentityGenomeVersion


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


class InMemoryIdentityGenomeVersionRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, list[IdentityGenomeVersion]] = {}

    async def add(self, version: IdentityGenomeVersion) -> IdentityGenomeVersion:
        self._items.setdefault(version.identity_genome_id, []).append(version)
        return version

    async def list_for_genome(self, genome_id: UUID) -> list[IdentityGenomeVersion]:
        return list(self._items.get(genome_id, []))

    async def latest(self, genome_id: UUID) -> IdentityGenomeVersion | None:
        versions = self._items.get(genome_id, [])
        return versions[-1] if versions else None
