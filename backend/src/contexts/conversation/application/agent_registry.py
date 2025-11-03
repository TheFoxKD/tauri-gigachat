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

    def get_or_create(self, raw_conversation_id: str | None) -> RegistryResult:
        conversation_id = self._resolve_id(raw_conversation_id)
        if conversation_id not in self.agents:
            # Привязываем общий LLM и отдельную память к каждому идентификатору диалога.
            memory = self.memory_store.get(conversation_id)
            self.agents[conversation_id] = AgentHandle(llm=self.llm, history=memory)
        return RegistryResult(
            conversation_id=conversation_id, agent=self.agents[conversation_id]
        )

    def reset(self, raw_conversation_id: str | None) -> None:
        conversation_id = self._normalize(raw_conversation_id)
        if not conversation_id:
            return
        self.agents.pop(conversation_id, None)
        self.memory_store.reset(conversation_id)

    def _resolve_id(self, raw_id: str | None) -> str:
        normalized = self._normalize(raw_id)
        return normalized or self._generate_id()

    def _normalize(self, raw_id: str | None) -> str | None:
        if raw_id and raw_id.strip():
            return raw_id.strip()
        return None

    def _generate_id(self) -> str:
        return f"c_{uuid4().hex}"
