from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_identity_service
from app.identity.schemas import CreateIdentityGenomeRequest, IdentityGenomeResponse
from app.identity.service import IdentityGenomeService

router = APIRouter(prefix="/identity-genomes", tags=["Identity Genome"])


@router.post("", response_model=IdentityGenomeResponse, status_code=status.HTTP_201_CREATED)
async def create_identity_genome(
    request: CreateIdentityGenomeRequest,
    service: IdentityGenomeService = Depends(get_identity_service),
) -> IdentityGenomeResponse:
    return IdentityGenomeResponse.model_validate(
        await service.create(request), from_attributes=True
    )


@router.get("/{genome_id}", response_model=IdentityGenomeResponse)
async def get_identity_genome(
    genome_id: UUID, service: IdentityGenomeService = Depends(get_identity_service)
) -> IdentityGenomeResponse:
    return IdentityGenomeResponse.model_validate(await service.get(genome_id), from_attributes=True)
