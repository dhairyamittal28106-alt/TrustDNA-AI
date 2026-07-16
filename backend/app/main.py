from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.agents.stubs import StubInvestigationAgent
from app.api.router import api_router
from app.certificate.repository import InMemoryCertificateRepository
from app.certificate.service import CertificateService
from app.core.config import get_settings
from app.core.errors import DomainError, domain_error_handler, unhandled_error_handler
from app.core.logging import configure_logging
from app.domain.enums import AgentName
from app.identity.repository import InMemoryIdentityGenomeRepository
from app.identity.service import IdentityGenomeService
from app.investigation.repository import InMemoryInvestigationRepository
from app.investigation.risk import RiskEngine
from app.investigation.sentinel import SentinelOrchestrator
from app.investigation.service import InvestigationService

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging(settings.log_level)
    identity_service = IdentityGenomeService(InMemoryIdentityGenomeRepository())
    app.state.identity_service = identity_service
    app.state.investigation_service = InvestigationService(
        InMemoryInvestigationRepository(), identity_service
    )
    app.state.certificate_service = CertificateService(InMemoryCertificateRepository())
    app.state.sentinel = SentinelOrchestrator(
        [StubInvestigationAgent(name) for name in AgentName], RiskEngine()
    )
    logger.info("application_started", environment=settings.environment)
    yield
    logger.info("application_stopped")


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.include_router(api_router)
app.add_exception_handler(DomainError, domain_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)


@app.get("/health", tags=["System"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
