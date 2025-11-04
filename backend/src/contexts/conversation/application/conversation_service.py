from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Iterable

from langchain_core.messages import (
    BaseMessage,
    HumanMessage,
    SystemMessage,
)
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
    content=(
        "You are a helpful assistant for a GigaChat desktop client. "
        "Answer directly and follow the user's instructions precisely. "
        "Default language: Russian. Keep replies short, clear, and structured.\n\n"
        "Formatting rules (strict):\n"
        "- If the user explicitly requests plain text (e.g., 'без форматирования', 'plain', 'text/plain', 'format: plain'), respond in pure plain text with no Markdown and no KaTeX.\n"
        "- For very short answers (1–2 sentences) prefer plain text unless formatting is explicitly beneficial or requested.\n"
        "- Use Markdown only (paragraphs, ##/### headings, lists, links, tables, inline code, fenced code blocks). Do not output raw HTML.\n"
        "- Code: always use fenced blocks with a language tag (e.g., ```python). Prefer correct language names for highlight.js.\n"
        "- Math: use KaTeX-compatible LaTeX delimiters: $...$ for inline, $$...$$ for display.\n"
        "  Do not wrap LaTeX in code blocks. Avoid unsupported KaTeX commands; prefer standard alternatives.\n"
        "- Do not mix code fences and LaTeX in the same fragment. Use the proper delimiter for each.\n"
        "- Do not interleave Markdown formatting inside LaTeX expressions; keep LaTeX clean.\n"
        "- If unsure about a symbol/command, choose a supported KaTeX notation or state briefly that it is unsupported."
    )
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

    def _content_to_text(self, content: str | list[str] | tuple[str]) -> str:
        """Превращает произвольное содержимое LangChain в строку."""

        if isinstance(content, str):
            return content

        if isinstance(content, (list, tuple)):
            parts: list[str] = []
            for part in content:
                if isinstance(part, str):
                    parts.append(part)
                    continue
            return "".join(parts)

    async def _iter_stream_text(
        self, agent: AgentHandle, messages: Iterable[BaseMessage]
    ) -> AsyncIterator[str]:
        """Итерирует текстовые фрагменты независимо от API провайдера.

        Порядок предпочтений:
        1) astream_events → on_chat_model_stream (делта-чанки)
        2) astream_text → текстовые чанки
        3) astream → AIMessageChunk → извлекаем текст
        """
        async for chunk in agent.llm.astream(
            messages,
        ):
            yield self._content_to_text(chunk.content)

        return
