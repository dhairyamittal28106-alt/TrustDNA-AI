from typing import Protocol
from uuid import UUID

from app.certificate.models import TrustDNACertificate


class CertificateRepository(Protocol):
    async def add(self, certificate: TrustDNACertificate) -> TrustDNACertificate: ...

    async def get(self, certificate_id: UUID) -> TrustDNACertificate | None: ...


class InMemoryCertificateRepository:
    def __init__(self) -> None:
        self._items: dict[UUID, TrustDNACertificate] = {}

    async def get(self, certificate_id: UUID) -> TrustDNACertificate | None:
        return self._items.get(certificate_id)

    async def add(self, certificate: TrustDNACertificate) -> TrustDNACertificate:
        self._items[certificate.id] = certificate
        return certificate
