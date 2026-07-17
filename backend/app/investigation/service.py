from datetime import UTC, datetime
from uuid import UUID

from app.agents.contracts import InvestigationContext
from app.artifact.service import ArtifactIngestionService
from app.certificate.models import TrustDNACertificate
from app.certificate.service import CertificateService
from app.core.errors import NotFoundError
from app.domain.enums import CaseLifecycleState, InvestigationStatus, Verdict
from app.identity.service import IdentityGenomeService
from app.identity.versioning import IdentityGenomeVersionService
from app.investigation.lifecycle import CaseLifecycle
from app.investigation.models import Investigation, LifecycleEvent
from app.investigation.repository import InvestigationRepository
from app.investigation.schemas import CreateInvestigationRequest
from app.investigation.sentinel import SentinelOrchestrator
from app.shared.ids import uuid7


class InvestigationService:
    def __init__(
        self,
        repository: InvestigationRepository,
        identity_service: IdentityGenomeService,
        artifact_service: ArtifactIngestionService,
        sentinel: SentinelOrchestrator,
        version_service: IdentityGenomeVersionService,
        certificate_service: CertificateService,
    ) -> None:
        self._repository = repository
        self._identity_service = identity_service
        self._artifact_service = artifact_service
        self._sentinel = sentinel
        self._version_service = version_service
        self._certificate_service = certificate_service

    @staticmethod
    def _advance(investigation: Investigation, target: CaseLifecycleState) -> Investigation:
        CaseLifecycle.transition(investigation.lifecycle_state, target)
        event = LifecycleEvent(state=target, occurred_at=datetime.now(UTC))
        return investigation.model_copy(
            update={
                "lifecycle_state": target,
                "timeline": [*investigation.timeline, event],
                "updated_at": datetime.now(UTC),
            }
        )

    async def open(self, request: CreateInvestigationRequest) -> Investigation:
        await self._identity_service.get(request.identity_genome_id)
        genome_version = await self._version_service.latest_version(request.identity_genome_id)
        now = datetime.now(UTC)
        investigation_id = uuid7()
        investigation = Investigation(
            id=investigation_id,
            case_number=f"TDNA-{now.year}-{str(investigation_id).split('-')[0].upper()}",
            identity_genome_id=request.identity_genome_id,
            artifact_type=request.artifact_type,
            artifact_reference=request.artifact_reference,
            genome_version=genome_version,
            status=InvestigationStatus.QUEUED,
            lifecycle_state=CaseLifecycleState.CASE_CREATED,
            timeline=[LifecycleEvent(state=CaseLifecycleState.CASE_CREATED, occurred_at=now)],
            verdict=Verdict.PENDING,
            risk_level=None,
            opened_at=now,
            updated_at=now,
        )
        return await self._repository.add(investigation)

    async def get(self, investigation_id: UUID) -> Investigation:
        investigation = await self._repository.get(investigation_id)
        if investigation is None:
            raise NotFoundError("Investigation", str(investigation_id), "INVESTIGATION_NOT_FOUND")
        return investigation

    async def run_text(
        self, investigation_id: UUID, content: str
    ) -> tuple[Investigation, list, object, TrustDNACertificate]:
        investigation = await self.get(investigation_id)
        genome = await self._identity_service.get(investigation.identity_genome_id)
        investigation = self._advance(investigation, CaseLifecycleState.COLLECTING_EVIDENCE)
        artifact = await self._artifact_service.process_text(
            genome.owner_id, content, investigation.artifact_reference
        )
        investigation = self._advance(investigation, CaseLifecycleState.DISPATCHING_AGENTS)
        profile = await self._artifact_service.get_profile(genome.id)
        investigation = self._advance(investigation, CaseLifecycleState.AWAITING_RESULTS)
        context = InvestigationContext(
            case_id=investigation.id,
            identity_genome_id=genome.id,
            identity_genome_version=investigation.genome_version,
            identity_vocabulary=profile.vocabulary if profile else set(),
            artifact_type=artifact.artifact_type,
            artifact_reference=investigation.artifact_reference,
            artifact_text=artifact.redacted_text or "",
            metadata=artifact.metadata,
            opened_at=investigation.opened_at,
        )
        results, risk = await self._sentinel.investigate(context)
        investigation = self._advance(investigation, CaseLifecycleState.AGGREGATING)
        investigation = self._advance(investigation, CaseLifecycleState.RISK_ANALYSIS)
        investigation = self._advance(investigation, CaseLifecycleState.GENERATING_FINDINGS)
        investigation = self._advance(investigation, CaseLifecycleState.GENERATING_CERTIFICATE)
        certificate = await self._certificate_service.issue(genome.id, investigation.id, risk)
        investigation = self._advance(investigation, CaseLifecycleState.CLOSED)
        completed = investigation.model_copy(
            update={
                "status": InvestigationStatus.COMPLETED,
                "verdict": risk.verdict,
                "risk_level": risk.risk_level,
                "updated_at": datetime.now(UTC),
            }
        )
        await self._repository.save(completed)
        return completed, results, risk, certificate
