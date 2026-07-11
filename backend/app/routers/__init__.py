from fastapi import APIRouter

from app.routers import action_items, annotations, ask, auth, meetings, search

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(meetings.router)
api_router.include_router(action_items.router)
api_router.include_router(annotations.router)
api_router.include_router(ask.router)
api_router.include_router(search.router)
