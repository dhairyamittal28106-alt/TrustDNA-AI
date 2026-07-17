from typing import Protocol
from uuid import UUID

from app.investigation.models import Investigation


class InvestigationRepository(Protocol):
    async def add(self, investigation: Investigation) -> Investigation: ...

    async def get(self, investigation_id: UUID) -> Investigation | None: ...

    async def save(self, investigation: Investigation) -> Investigation: ...


class InMemoryInvestigationRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, Investigation] = {}

    async def add(self, investigation: Investigation) -> Investigation:
        self._items[investigation.id] = investigation
        return investigation

    async def get(self, investigation_id: UUID) -> Investigation | None:
        return self._items.get(investigation_id)

    async def save(self, investigation: Investigation) -> Investigation:
        self._items[investigation.id] = investigation
        return investigation
