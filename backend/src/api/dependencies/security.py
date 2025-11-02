from functools import lru_cache

from fastapi.security import HTTPBasic


@lru_cache
def get_http_basic_security() -> HTTPBasic:
    return HTTPBasic()
