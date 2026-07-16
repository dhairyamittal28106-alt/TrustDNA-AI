from fastapi import APIRouter

from app.certificate.routes import router as certificate_router
from app.identity.routes import router as identity_router
from app.investigation.routes import router as investigation_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(identity_router)
api_router.include_router(investigation_router)
api_router.include_router(certificate_router)
