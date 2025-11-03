from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from langchain_gigachat.chat_models import GigaChat

from contexts.conversation.application.agent_registry import AgentRegistry
from contexts.conversation.application.conversation_service import ConversationService
from src.api.dependencies.container import get_container
from src.contexts.conversation.base.memory import ConversationMemoryStore
from src.core.container import AppContainer


def get_conversation_memory_store(
    container: Annotated[AppContainer, Depends(get_container)],
) -> ConversationMemoryStore:
    return container.memory_store


def get_gigachat_llm(
    container: Annotated[AppContainer, Depends(get_container)],
) -> GigaChat:
    return container.llm


def get_agent_registry(
    container: Annotated[AppContainer, Depends(get_container)],
) -> AgentRegistry:
    return container.agent_registry


def get_conversation_service(
    registry: Annotated[AgentRegistry, Depends(get_agent_registry)],
) -> ConversationService:
    return ConversationService(registry=registry)
