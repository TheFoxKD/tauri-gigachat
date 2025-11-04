from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sse_starlette.event import ServerSentEvent
from sse_starlette.sse import EventSourceResponse

from src.api.schemas import DetailResponse

from src.api.v1.request.schemas import RequestPayload, RequestResponse
from src.api.auth.basic import require_basic
from src.api.dependencies.conversation import get_conversation_service
from src.contexts.conversation.application.conversation_service import (
    ConversationService,
)


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
                    yield ServerSentEvent(event="content", data=token)
            except Exception as exc:
                yield ServerSentEvent(event="error", data=str(exc))
            finally:
                yield ServerSentEvent(event="done", data="[DONE]")

        return EventSourceResponse(
            content=event_stream(),
            headers={
                "Conversation-Id": stream_result.conversation_id,
            },
        )

    run_result = await service.arun_text(
        conversation_id=payload.conversation_id,
        message=payload.message,
    )
    return RequestResponse(
        content=run_result.content,
        conversation_id=run_result.conversation_id,
    )
