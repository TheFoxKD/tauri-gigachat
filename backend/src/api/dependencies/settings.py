from functools import lru_cache
from typing import Annotated

from core.settings import AppSettings
from src.api.dependencies.container import get_container
from src.core.container import AppContainer


@lru_cache(maxsize=1)
def get_settings(container: Annotated[AppContainer, get_container]) -> AppSettings:
    return container.settings
