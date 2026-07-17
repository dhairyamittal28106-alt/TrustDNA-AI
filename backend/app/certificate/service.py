from datetime import UTC, datetime
from uuid import UUID

from app.certificate.models import TrustDNACertificate
from app.certificate.repository import CertificateRepository
from app.core.errors import NotFoundError
from app.domain.enums import RiskLevel
from app.investigation.risk import RiskAssessment
from app.shared.ids import uuid7


class CertificateService:
    def __init__(self, repository: CertificateRepository) -> None:
        self._repository = repository

    async def issue(
        self, identity_genome_id: UUID, investigation_id: UUID, assessment: RiskAssessment
    ) -> TrustDNACertificate:
        rating = {
            RiskLevel.LOW: "AAA",
            RiskLevel.MEDIUM: "BBB",
            RiskLevel.HIGH: "D",
            RiskLevel.CRITICAL: "F",
        }[assessment.risk_level]
        certificate_id = uuid7()
        certificate = TrustDNACertificate(
            id=certificate_id,
            certificate_number=f"TDNA-{datetime.now(UTC).year}-{str(certificate_id).split('-')[0].upper()}",
            identity_genome_id=identity_genome_id,
            investigation_id=investigation_id,
            identity_confidence=assessment.confidence,
            trust_rating=rating,
            issued_at=datetime.now(UTC),
        )
        return await self._repository.add(certificate)

    async def get(self, certificate_id: UUID) -> TrustDNACertificate:
        certificate = await self._repository.get(certificate_id)
        if certificate is None:
            raise NotFoundError("Certificate", str(certificate_id), "CERTIFICATE_NOT_FOUND")
        return certificate
