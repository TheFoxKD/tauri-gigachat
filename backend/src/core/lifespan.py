import contextlib
from typing import AsyncIterator

from fastapi import FastAPI

from src.contexts.conversation.infrastructure.memory import ConversationMemoryStore


@contextlib.asynccontextmanager
async def app_lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Provision shared resources for the whole app lifetime.

    We create a single ConversationMemoryStore to persist chat history between
    requests. The store lives in ``app.state`` so FastAPI dependencies can
    access it without relying on module-level globals.
    """

    app.state.conversation_memory_store = ConversationMemoryStore()
    try:
        yield
    finally:
        del app.state.conversation_memory_store
