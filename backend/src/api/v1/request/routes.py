import json
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sse_starlette.event import ServerSentEvent
from sse_starlette.sse import EventSourceResponse

from src.api.schemas import DetailResponse

from .schemas import RequestPayload, RequestResponse
from api.auth.basic import require_basic
from api.dependencies.conversation import get_conversation_service
from contexts.conversation.application.conversation_service import ConversationService


router = APIRouter(
    prefix="/request",
    tags=["Request"],
    dependencies=[Depends(require_basic)],
)


@router.post(
    "",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": DetailResponse,
            "description": "Unauthorized",
        },
    },
)
async def request(
    request: Request,
    payload: RequestPayload,
    service: Annotated[ConversationService, Depends(get_conversation_service)],
) -> RequestResponse:
    if payload.stream:
        stream_result = service.start_stream(
            conversation_id=payload.conversation_id,
            message=payload.message,
        )

        async def event_stream() -> AsyncIterator[ServerSentEvent]:
            try:
                async for token in stream_result.stream:
                    if await request.is_disconnected():
                        break
                    yield ServerSentEvent(data=json.dumps({"content": token}))
            except Exception as exc:
                yield ServerSentEvent(data=json.dumps({"error": str(exc)}))
            finally:
                yield ServerSentEvent(data="[DONE]")

        return EventSourceResponse(
            event_stream(),
            media_type="text/event-stream; charset=utf-8",
            headers={
                "X-Conversation-Id": stream_result.conversation_id,
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
            ping=15000,
        )

    run_result = await service.arun_text(
        conversation_id=payload.conversation_id,
        message=payload.message,
    )
    return RequestResponse(
        content=run_result.content,
        conversation_id=run_result.conversation_id,
    )
