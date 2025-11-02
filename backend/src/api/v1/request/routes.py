from fastapi import APIRouter

from .schemas import RequestPayload, RequestResponse


router = APIRouter(prefix="/v1", tags=["request"])


@router.post(
    "/request",
    response_model=RequestResponse,
    summary="LLM request (stub)",
    description="Возвращает заглушку ответа. Позже будет проксирование в GigaChat.",
)
async def create_request(payload: RequestPayload) -> RequestResponse:
    return RequestResponse(
        content=f"[stub] stream={payload.stream} message={payload.message}"
    )
