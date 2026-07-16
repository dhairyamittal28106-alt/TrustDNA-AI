from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IdentityGenome(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    owner_id: UUID
    display_name: str = Field(min_length=1, max_length=120)
    created_at: datetime
    updated_at: datetime
