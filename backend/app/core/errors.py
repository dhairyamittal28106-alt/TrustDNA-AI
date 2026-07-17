from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.status import (
    HTTP_404_NOT_FOUND,
    HTTP_422_UNPROCESSABLE_CONTENT,
    HTTP_500_INTERNAL_SERVER_ERROR,
)


class ErrorResponse(BaseModel):
    code: str = Field(pattern=r"^[A-Z0-9_]+$")
    message: str
    request_id: str
    timestamp: datetime
    details: dict[str, Any] = Field(default_factory=dict)


class DomainError(Exception):
    def __init__(
        self, code: str, message: str, status_code: int, details: dict[str, Any] | None = None
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundError(DomainError):
    def __init__(self, resource: str, resource_id: str, code: str) -> None:
        super().__init__(code, f"{resource} not found", HTTP_404_NOT_FOUND, {"id": resource_id})


def to_error_response(request: Request, error: DomainError) -> ErrorResponse:
    return ErrorResponse(
        code=error.code,
        message=error.message,
        request_id=getattr(request.state, "request_id", "unknown"),
        timestamp=datetime.now(UTC),
        details=error.details,
    )


async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code, content=to_error_response(request, exc).model_dump(mode="json")
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    error = DomainError(
        "VALIDATION_ERROR",
        "Request validation failed",
        HTTP_422_UNPROCESSABLE_CONTENT,
        {"errors": exc.errors()},
    )
    return JSONResponse(
        status_code=error.status_code,
        content=to_error_response(request, error).model_dump(mode="json"),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "HTTP request failed"
    error = DomainError(f"HTTP_{exc.status_code}", message, exc.status_code)
    return JSONResponse(
        status_code=error.status_code,
        content=to_error_response(request, error).model_dump(mode="json"),
    )


async def unhandled_error_handler(request: Request, _: Exception) -> JSONResponse:
    error = DomainError(
        "INTERNAL_ERROR", "An unexpected error occurred", HTTP_500_INTERNAL_SERVER_ERROR
    )
    return JSONResponse(
        status_code=error.status_code,
        content=to_error_response(request, error).model_dump(mode="json"),
    )
