from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.artifact.service import ArtifactIngestionService
from app.core.dependencies import (
    get_artifact_ingestion_service,
    get_identity_service,
    get_identity_version_service,
)
from app.core.openapi import ERROR_RESPONSES
from app.identity.schemas import (
    CreateIdentityGenomeRequest,
    IdentityGenomeResponse,
    IdentityGenomeVersionResponse,
    IdentityProfileResponse,
    IngestTextRequest,
)
from app.identity.service import IdentityGenomeService
from app.identity.versioning import IdentityGenomeVersionService

router = APIRouter(prefix="/identity-genomes", tags=["Identity Genome"])


@router.post(
    "",
    response_model=IdentityGenomeResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
)
async def create_identity_genome(
    request: CreateIdentityGenomeRequest,
    service: IdentityGenomeService = Depends(get_identity_service),
) -> IdentityGenomeResponse:
    return IdentityGenomeResponse.model_validate(
        await service.create(request), from_attributes=True
    )


@router.get("/{genome_id}", response_model=IdentityGenomeResponse, responses=ERROR_RESPONSES)
async def get_identity_genome(
    genome_id: UUID, service: IdentityGenomeService = Depends(get_identity_service)
) -> IdentityGenomeResponse:
    return IdentityGenomeResponse.model_validate(await service.get(genome_id), from_attributes=True)


@router.post(
    "/{genome_id}/samples/text",
    response_model=IdentityProfileResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
)
async def ingest_text_sample(
    genome_id: UUID,
    request: IngestTextRequest,
    service: IdentityGenomeService = Depends(get_identity_service),
    ingestion: ArtifactIngestionService = Depends(get_artifact_ingestion_service),
    versions: IdentityGenomeVersionService = Depends(get_identity_version_service),
) -> IdentityProfileResponse:
    genome = await service.get(genome_id)
    profile = await ingestion.ingest_text(
        genome.owner_id, genome.id, request.content, request.source_label
    )
    version = await versions.record(genome.id, profile)
    response = IdentityProfileResponse.from_profile(profile)
    return response.model_copy(update={"version": version.version})


@router.get(
    "/{genome_id}/versions",
    response_model=list[IdentityGenomeVersionResponse],
    responses=ERROR_RESPONSES,
)
async def list_identity_genome_versions(
    genome_id: UUID,
    service: IdentityGenomeService = Depends(get_identity_service),
    versions: IdentityGenomeVersionService = Depends(get_identity_version_service),
) -> list[IdentityGenomeVersionResponse]:
    await service.get(genome_id)
    return [
        IdentityGenomeVersionResponse.model_validate(version, from_attributes=True)
        for version in await versions.list(genome_id)
    ]
