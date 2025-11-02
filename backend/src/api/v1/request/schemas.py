from pydantic import BaseModel


class RequestPayload(BaseModel):
    """Параметры запроса пользователя."""

    message: str
    stream: bool = True
    conversation_id: str | None = None


class RequestResponse(BaseModel):
    content: str
    conversation_id: str
