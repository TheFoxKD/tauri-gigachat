from typing import Annotated

from fastapi import Depends

from contexts.conversation.application.agent_registry import AgentRegistry
from contexts.conversation.application.conversation_service import ConversationService
from src.api.dependencies.settings import get_settings
from src.core.settings import AppSettings
from src.contexts.conversation.infrastructure.memory import ConversationMemoryStore


def get_conversation_memory_store() -> ConversationMemoryStore:
    return ConversationMemoryStore()


def get_agent_registry(
    settings: Annotated[AppSettings, Depends(get_settings)],
    memory_store: Annotated[
        ConversationMemoryStore, Depends(get_conversation_memory_store)
    ],
) -> AgentRegistry:
    return AgentRegistry(
        credentials=settings.gigachat_credentials,
        memory_store=memory_store,
    )


def get_conversation_service(
    registry: Annotated[AgentRegistry, Depends(get_agent_registry)],
) -> ConversationService:
    return ConversationService(registry=registry)
