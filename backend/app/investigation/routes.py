from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.certificate.schemas import CertificateResponse
from app.core.dependencies import get_investigation_service
from app.core.openapi import ERROR_RESPONSES
from app.investigation.schemas import (
    CreateInvestigationRequest,
    InvestigationResponse,
    InvestigationRunResponse,
    RunTextInvestigationRequest,
)
from app.investigation.service import InvestigationService

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post(
    "",
    response_model=InvestigationResponse,
    status_code=status.HTTP_201_CREATED,
    responses=ERROR_RESPONSES,
)
async def open_investigation(
    request: CreateInvestigationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> InvestigationResponse:
    return InvestigationResponse.model_validate(await service.open(request), from_attributes=True)


@router.get("/{investigation_id}", response_model=InvestigationResponse, responses=ERROR_RESPONSES)
async def get_investigation(
    investigation_id: UUID, service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationResponse:
    return InvestigationResponse.model_validate(
        await service.get(investigation_id), from_attributes=True
    )


@router.post(
    "/{investigation_id}/run-text",
    response_model=InvestigationRunResponse,
    responses=ERROR_RESPONSES,
)
async def run_text_investigation(
    investigation_id: UUID,
    request: RunTextInvestigationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> InvestigationRunResponse:
    investigation, agents, risk, certificate = await service.run_text(
        investigation_id, request.content
    )
    return InvestigationRunResponse(
        investigation=InvestigationResponse.model_validate(investigation, from_attributes=True),
        agents=agents,
        risk=risk,
        certificate=CertificateResponse.model_validate(certificate, from_attributes=True),
    )
