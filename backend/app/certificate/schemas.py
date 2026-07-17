from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: UUID
    certificate_number: str
    identity_genome_id: UUID
    investigation_id: UUID
    identity_confidence: float
    trust_rating: str
    issued_at: datetime
