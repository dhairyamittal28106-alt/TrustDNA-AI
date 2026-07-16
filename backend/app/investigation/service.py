from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import NotFoundError
from app.domain.enums import InvestigationStatus, Verdict
from app.identity.service import IdentityGenomeService
from app.investigation.models import Investigation
from app.investigation.repository import InvestigationRepository
from app.investigation.schemas import CreateInvestigationRequest
from app.shared.ids import uuid7


class InvestigationService:
    def __init__(
        self, repository: InvestigationRepository, identity_service: IdentityGenomeService
    ) -> None:
        self._repository = repository
        self._identity_service = identity_service

    async def open(self, request: CreateInvestigationRequest) -> Investigation:
        await self._identity_service.get(request.identity_genome_id)
        now = datetime.now(UTC)
        investigation_id = uuid7()
        investigation = Investigation(
            id=investigation_id,
            case_number=f"TDNA-{now.year}-{str(investigation_id).split('-')[0].upper()}",
            identity_genome_id=request.identity_genome_id,
            artifact_type=request.artifact_type,
            artifact_reference=request.artifact_reference,
            status=InvestigationStatus.QUEUED,
            verdict=Verdict.PENDING,
            risk_level=None,
            opened_at=now,
            updated_at=now,
        )
        return await self._repository.add(investigation)

    async def get(self, investigation_id: UUID) -> Investigation:
        investigation = await self._repository.get(investigation_id)
        if investigation is None:
            raise NotFoundError("Investigation", str(investigation_id))
        return investigation
