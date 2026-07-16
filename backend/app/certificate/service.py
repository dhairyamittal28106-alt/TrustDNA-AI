from uuid import UUID

from app.certificate.models import TrustDNACertificate
from app.certificate.repository import CertificateRepository
from app.core.errors import NotFoundError


class CertificateService:
    def __init__(self, repository: CertificateRepository) -> None:
        self._repository = repository

    async def get(self, certificate_id: UUID) -> TrustDNACertificate:
        certificate = await self._repository.get(certificate_id)
        if certificate is None:
            raise NotFoundError("Certificate", str(certificate_id))
        return certificate
