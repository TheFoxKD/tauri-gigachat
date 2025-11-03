from fastapi import FastAPI

from src.api.router import api_router
from src.core.lifespan import app_lifespan

app = FastAPI(
    title="GigaChat Backend",
    version="1.0.0",
    lifespan=app_lifespan,
)

app.include_router(api_router)
