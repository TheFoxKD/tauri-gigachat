from fastapi import APIRouter
from .v1.request.routes import router as v1_request_router


api_router = APIRouter()
api_router.include_router(v1_request_router)
