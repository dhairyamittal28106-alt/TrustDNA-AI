from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.agents.stubs import CipherAgent, StubInvestigationAgent
from app.api.router import api_router
from app.artifact.pipeline import ArtifactPipeline
from app.artifact.processors import (
    ArtifactClassifier,
    DeterministicEmbeddingProvider,
    EvidenceFeatureExtractor,
    MetadataExtractor,
    PiiRedactor,
    TextChunker,
    TextExtractor,
    TextNormalizer,
)
from app.artifact.repository import (
    InMemoryArtifactRepository,
    InMemoryEmbeddingStore,
    InMemoryIdentityProfileRepository,
)
from app.artifact.service import ArtifactIngestionService
from app.certificate.repository import InMemoryCertificateRepository
from app.certificate.service import CertificateService
from app.core.config import get_settings
from app.core.errors import (
    DomainError,
    domain_error_handler,
    http_exception_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from app.core.logging import configure_logging
from app.core.openapi import ERROR_RESPONSES
from app.core.request_id import RequestIdMiddleware
from app.domain.enums import AgentName
from app.identity.repository import (
    InMemoryIdentityGenomeRepository,
    InMemoryIdentityGenomeVersionRepository,
)
from app.identity.service import IdentityGenomeService
from app.identity.versioning import IdentityGenomeVersionService
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
    app.state.identity_version_service = IdentityGenomeVersionService(
        InMemoryIdentityGenomeVersionRepository()
    )
    app.state.certificate_service = CertificateService(InMemoryCertificateRepository())
    app.state.artifact_ingestion_service = ArtifactIngestionService(
        ArtifactPipeline(
            [
                ArtifactClassifier(),
                TextExtractor(),
                TextNormalizer(),
                PiiRedactor(),
                MetadataExtractor(),
                EvidenceFeatureExtractor(),
                TextChunker(),
            ]
        ),
        DeterministicEmbeddingProvider(),
        InMemoryArtifactRepository(),
        InMemoryEmbeddingStore(),
        InMemoryIdentityProfileRepository(),
    )
    app.state.sentinel = SentinelOrchestrator(
        [
            CipherAgent(),
            *[StubInvestigationAgent(name) for name in AgentName if name != AgentName.CIPHER],
        ],
        RiskEngine(),
    )
    app.state.investigation_service = InvestigationService(
        InMemoryInvestigationRepository(),
        identity_service,
        app.state.artifact_ingestion_service,
        app.state.sentinel,
        app.state.identity_version_service,
        app.state.certificate_service,
    )
    logger.info("application_started", environment=settings.environment)
    yield
    logger.info("application_stopped")


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)
app.add_middleware(RequestIdMiddleware)
app.include_router(api_router)
app.add_exception_handler(DomainError, domain_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_error_handler)


@app.get("/health", tags=["System"], responses=ERROR_RESPONSES)
async def health() -> dict[str, str]:
    return {"status": "ok"}
