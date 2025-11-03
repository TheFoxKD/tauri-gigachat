from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Iterable

from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, ConfigDict

from src.contexts.conversation.application.agent_registry import (
    AgentHandle,
    AgentRegistry,
)


class RunTextResult(BaseModel):
    """Ответ для синхронного режима."""

    conversation_id: str
    content: str


class StreamResult(BaseModel):
    """Ответ при запуске стрима."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    conversation_id: str
    stream: AsyncIterator[str]


# Системное сообщение держим отдельной константой, чтобы не дублировать его в памяти диалога.
SYSTEM_MESSAGE = SystemMessage(
    content="You are a helpful assistant. Keep replies short and clear."
)


@dataclass
class ConversationService:
    registry: AgentRegistry

    async def arun_text(
        self, *, conversation_id: str | None, message: str
    ) -> RunTextResult:
        """Возвращает полный ответ без стрима."""

        registry_result = self.registry.get_or_create(conversation_id)
        messages = self._compose_messages(
            registry_result.agent.history.messages, message
        )

        # ainvoke возвращает AIMessage, поэтому преобразуем ответ в строку вручную.
        ai_message = await registry_result.agent.llm.ainvoke(messages)
        response_text = self._message_to_text(ai_message)

        # Сохраняем обе реплики после успешного запроса, чтобы история оставалась согласованной.
        registry_result.agent.history.add_user_message(message)
        registry_result.agent.history.add_ai_message(response_text)

        return RunTextResult(
            conversation_id=registry_result.conversation_id,
            content=response_text,
        )

    def start_stream(
        self, *, conversation_id: str | None, message: str
    ) -> StreamResult:
        """Готовит стрим токенов для SSE."""

        registry_result = self.registry.get_or_create(conversation_id)
        messages = self._compose_messages(
            registry_result.agent.history.messages, message
        )

        async def token_stream() -> AsyncIterator[str]:
            collected_chunks: list[str] = []

            async for text in self._iter_stream_text(registry_result.agent, messages):
                collected_chunks.append(text)
                yield text

            full_response = "".join(collected_chunks)
            registry_result.agent.history.add_user_message(message)
            registry_result.agent.history.add_ai_message(full_response)

        return StreamResult(
            conversation_id=registry_result.conversation_id,
            stream=token_stream(),
        )

    def _compose_messages(
        self, history_messages: Iterable[BaseMessage], user_text: str
    ) -> list[BaseMessage]:
        """Собирает полный список сообщений для текущего запроса."""

        conversation: list[BaseMessage] = [SYSTEM_MESSAGE]
        conversation.extend(history_messages)
        conversation.append(HumanMessage(content=user_text))
        return conversation

    def _message_to_text(self, message: BaseMessage) -> str:
        """Извлекает текст из ответа модели."""

        return self._content_to_text(message.content)

    def _content_to_text(self, content: object) -> str:
        """Превращает произвольное содержимое LangChain в строку."""

        if isinstance(content, str):
            return content

        if isinstance(content, (list, tuple)):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                    continue
                if isinstance(item, dict):
                    text = item.get("text")
                    if text:
                        parts.append(str(text))
            return "".join(parts)

        return str(content)

    async def _iter_stream_text(
        self, agent: AgentHandle, messages: Iterable[BaseMessage]
    ) -> AsyncIterator[str]:
        """Итерирует текстовые фрагменты независимо от API провайдера.

        Порядок предпочтений:
        1) astream_events → on_chat_model_stream (делта-чанки)
        2) astream_text → текстовые чанки
        3) astream → AIMessageChunk → извлекаем текст
        """

        if hasattr(agent.llm, "astream_events"):
            async for ev in agent.llm.astream_events(
                messages,
                version="v1",
            ):
                if ev.get("event") == "on_chat_model_stream":
                    data = ev.get("data") or {}
                    chunk = data.get("chunk")
                    if chunk is None:
                        continue
                    text = self._content_to_text(getattr(chunk, "content", ""))
                    if text:
                        yield text
            return

        if hasattr(agent.llm, "astream_text"):
            async for text in agent.llm.astream_text(messages):
                if text:
                    yield text
            return

        async for chunk in agent.llm.astream(messages):
            text = self._message_to_text(chunk)
            if text:
                yield text
