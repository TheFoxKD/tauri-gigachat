from pydantic import BaseModel


class RequestPayload(BaseModel):
    message: str
    stream: bool = True


class RequestResponse(BaseModel):
    content: str
