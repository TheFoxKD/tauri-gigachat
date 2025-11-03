import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasicCredentials

from api.dependencies.security import get_http_basic_security


async def require_basic(
    credentials: HTTPBasicCredentials = Depends(get_http_basic_security()),
) -> None:
    username_ok = secrets.compare_digest(credentials.username.encode("utf8"), b"giga")
    password_ok = secrets.compare_digest(credentials.password.encode("utf8"), b"top")

    if not (username_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
