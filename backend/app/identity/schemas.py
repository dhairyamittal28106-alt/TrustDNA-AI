from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreateIdentityGenomeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    owner_id: UUID
    display_name: str = Field(min_length=1, max_length=120)


class IdentityGenomeResponse(BaseModel):
    id: UUID
    owner_id: UUID
    display_name: str
    created_at: datetime
    updated_at: datetime
