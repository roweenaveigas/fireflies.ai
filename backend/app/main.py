import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine, Base
from app.models import Meeting
from app.routers import api_router
from app.seed import seed
import app.models  # noqa: F401 — register models before create_all


def _ensure_schema() -> None:
    """Create tables and add owner_id if upgrading an older SQLite file."""
    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    if "meetings" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("meetings")}
        if "owner_id" not in cols:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE meetings ADD COLUMN owner_id INTEGER "
                        "REFERENCES users(id) ON DELETE CASCADE"
                    )
                )


_ensure_schema()


def _seed_if_empty() -> None:
    """Load demo user + sample meetings when the database has none."""
    db: Session = SessionLocal()
    try:
        if db.query(Meeting).count() == 0:
            seed()
    finally:
        db.close()


_seed_if_empty()

app = FastAPI(
    title="Fireflies.ai Clone API",
    description="Meeting notes & transcription platform backend",
    version="0.1.0",
)

# Local defaults + optional comma-separated FRONTEND_ORIGINS for production (Vercel URL)
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_extra = [
    o.strip()
    for o in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if o.strip()
]
allow_origins = _default_origins + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/seed")
@app.get("/api/seed")
def seed_database():
    """Browser-friendly seed for hosts without a shell (e.g. Render free tier)."""
    seed()
    db = SessionLocal()
    try:
        count = db.query(Meeting).count()
    finally:
        db.close()
    return {
        "status": "ok",
        "meetings": count,
        "demo_email": "maya.rivera@acme.io",
        "demo_password": "Demo@1234",
        "demo_name": "Maya Rivera",
    }
