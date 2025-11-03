from fastapi import APIRouter

from src.api.v1.request.routes import router as request_router


router = APIRouter(prefix="/v1")
router.include_router(request_router)
