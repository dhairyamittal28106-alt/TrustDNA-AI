from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.status import HTTP_404_NOT_FOUND, HTTP_500_INTERNAL_SERVER_ERROR


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class DomainError(Exception):
    def __init__(
        self, code: str, message: str, status_code: int, details: dict[str, Any] | None = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundError(DomainError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            "not_found", f"{resource} not found", HTTP_404_NOT_FOUND, {"id": resource_id}
        )


async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(code=exc.code, message=exc.message, details=exc.details).model_dump(),
    )


async def unhandled_error_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            code="internal_error", message="An unexpected error occurred"
        ).model_dump(),
    )
