from pydantic import BaseModel, field_validator


class RequestPayload(BaseModel):
    message: str
    stream: bool = True
    conversation_id: str | None = None

    @field_validator("conversation_id", mode="before")
    def _normalize_conversation_id(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        if not normalized:
            return None

        return normalized


class RequestResponse(BaseModel):
    content: str
    conversation_id: str
