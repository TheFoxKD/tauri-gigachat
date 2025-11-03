import contextlib
from typing import AsyncIterator

from fastapi import FastAPI
from langchain_gigachat.chat_models import GigaChat

from src.contexts.conversation.application.agent_registry import AgentRegistry
from src.contexts.conversation.base.memory import ConversationMemoryStore
from src.core.container import AppContainer
from src.core.settings import AppSettings


@contextlib.asynccontextmanager
async def app_lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = AppSettings()
    memory_store = ConversationMemoryStore()
    llm = GigaChat(
        credentials=settings.gigachat_credentials,
        verify_ssl_certs=False,
        streaming=True,
    )
    registry = AgentRegistry(llm=llm, memory_store=memory_store)

    app.state.container = AppContainer(
        settings=settings,
        memory_store=memory_store,
        llm=llm,
        agent_registry=registry,
    )
    try:
        yield None
    finally:
        del app.state.container
