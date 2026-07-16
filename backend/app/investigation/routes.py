from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_investigation_service
from app.investigation.schemas import CreateInvestigationRequest, InvestigationResponse
from app.investigation.service import InvestigationService

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
async def open_investigation(
    request: CreateInvestigationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> InvestigationResponse:
    return InvestigationResponse.model_validate(await service.open(request), from_attributes=True)


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(
    investigation_id: UUID, service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationResponse:
    return InvestigationResponse.model_validate(
        await service.get(investigation_id), from_attributes=True
    )
