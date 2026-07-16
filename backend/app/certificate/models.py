from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TrustDNACertificate(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    certificate_number: str
    identity_genome_id: UUID
    identity_confidence: float = Field(ge=0, le=1)
    trust_rating: str
    issued_at: datetime
