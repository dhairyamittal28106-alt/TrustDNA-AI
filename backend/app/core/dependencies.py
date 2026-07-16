from fastapi import Request

from app.certificate.service import CertificateService
from app.identity.service import IdentityGenomeService
from app.investigation.service import InvestigationService


def get_identity_service(request: Request) -> IdentityGenomeService:
    return request.app.state.identity_service


def get_investigation_service(request: Request) -> InvestigationService:
    return request.app.state.investigation_service


def get_certificate_service(request: Request) -> CertificateService:
    return request.app.state.certificate_service
