"""Create all SQLite tables for the meeting-transcription app.

Usage (from backend/):
    python -m app.init_db
"""

from app.db.session import Base, engine, DATABASE_URL
import app.models  # noqa: F401 — register models on Base.metadata


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print(f"Tables created at {DATABASE_URL}")


if __name__ == "__main__":
    init_db()
