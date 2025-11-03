from dataclasses import dataclass, field
from uuid import uuid4

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_gigachat.chat_models import GigaChat
from pydantic import BaseModel, ConfigDict

from src.contexts.conversation.base.memory import ConversationMemoryStore


class AgentHandle(BaseModel):
    """Держатель зависимостей для одного диалога."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    llm: GigaChat
    history: BaseChatMessageHistory


class RegistryResult(BaseModel):
    """Результат регистрации агента с выбранным conversation_id."""

    conversation_id: str
    agent: AgentHandle


@dataclass
class AgentRegistry:
    llm: GigaChat
    memory_store: ConversationMemoryStore
    agents: dict[str, AgentHandle] = field(default_factory=dict)

    def get_or_create(self, conversation_id: str | None) -> RegistryResult:
        conversation_id = conversation_id or self._generate_id()
        if conversation_id not in self.agents:
            # Привязываем общий LLM и отдельную память к каждому идентификатору диалога.
            memory = self.memory_store.get(conversation_id)
            self.agents[conversation_id] = AgentHandle(llm=self.llm, history=memory)
        return RegistryResult(
            conversation_id=conversation_id, agent=self.agents[conversation_id]
        )

    def _generate_id(self) -> str:
        return f"c_{uuid4().hex}"
