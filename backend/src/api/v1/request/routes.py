from fastapi import APIRouter, Depends, status

from src.api.schemas import DetailResponse

from .schemas import RequestPayload, RequestResponse
from api.auth.basic import require_basic


router = APIRouter(
    prefix="/request",
    tags=["Request"],
    dependencies=[Depends(require_basic)],
)


@router.post(
    "",
    response_model=RequestResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": DetailResponse,
            "description": "Unauthorized",
        },
    },
    summary="LLM request (stub)",
    description="Возвращает заглушку ответа. Позже будет проксирование в GigaChat.",
)
async def create_request(payload: RequestPayload) -> RequestResponse:
    return RequestResponse(
        content=f"[stub] stream={payload.stream} message={payload.message}"
    )
