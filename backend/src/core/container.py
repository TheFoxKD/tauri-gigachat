from langchain_gigachat.chat_models import GigaChat
from pydantic import BaseModel, ConfigDict

from src.contexts.conversation.application.agent_registry import AgentRegistry
from src.contexts.conversation.base.memory import ConversationMemoryStore
from src.core.settings import AppSettings


class AppContainer(BaseModel):
    """Хранит все singleton-объекты приложения."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    settings: AppSettings
    memory_store: ConversationMemoryStore
    llm: GigaChat
    agent_registry: AgentRegistry
