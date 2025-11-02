from dataclasses import dataclass, field

from langchain_core.chat_history import (
    BaseChatMessageHistory,
    InMemoryChatMessageHistory,
)


@dataclass
class ConversationMemoryStore:
    items: dict[str, BaseChatMessageHistory] = field(default_factory=dict)

    def get(self, conversation_id: str) -> BaseChatMessageHistory:
        if conversation_id not in self.items:
            self.items[conversation_id] = InMemoryChatMessageHistory()
        return self.items[conversation_id]

    def reset(self, conversation_id: str) -> None:
        """Удаляет память для конкретного диалога."""
        self.items.pop(conversation_id, None)
