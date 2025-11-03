from fastapi import Request

from src.core.container import AppContainer


def get_container(request: Request) -> AppContainer:
    return request.app.state.container
