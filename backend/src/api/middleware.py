from typing import Any, Sequence
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp


class GigaCorsMiddleware(CORSMiddleware):
    OPTIONS = {
        "allow_origins": ["*"],
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
        "expose_headers": ["X-Conversation-Id"],
    }

    def __init__(
        self,
        app: ASGIApp,
    ) -> None:
        super().__init__(app, **self.OPTIONS)
