from uuid import UUID

from fastapi import APIRouter, Depends

from app.certificate.schemas import CertificateResponse
from app.certificate.service import CertificateService
from app.core.dependencies import get_certificate_service

router = APIRouter(prefix="/certificates", tags=["Certificates"])


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: UUID, service: CertificateService = Depends(get_certificate_service)
) -> CertificateResponse:
    return CertificateResponse.model_validate(
        await service.get(certificate_id), from_attributes=True
    )
