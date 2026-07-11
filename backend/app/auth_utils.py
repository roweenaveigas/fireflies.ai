"""Password hashing and session tokens (stdlib only — no extra deps)."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import AuthSession, User

PBKDF2_ITERATIONS = 120_000
TOKEN_BYTES = 32
SESSION_DAYS = 30

DEMO_EMAIL = "maya.rivera@acme.io"
DEMO_PASSWORD = "Demo@1234"
DEMO_NAME = "Maya Rivera"


def hash_password(password: str, salt: str | None = None) -> str:
    salt_bytes = (salt or secrets.token_hex(16)).encode("utf-8")
    if salt is None:
        salt = salt_bytes.decode("utf-8")
    else:
        salt_bytes = salt.encode("utf-8")
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters_s, salt, digest_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iters = int(iters_s)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iters,
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False


def create_user(db: Session, *, name: str, email: str, password: str) -> User:
    user = User(
        name=name.strip(),
        email=email.strip().lower(),
        password_hash=hash_password(password),
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    return user


def ensure_demo_user(db: Session) -> User:
    """Create or reset the demo account used for viva / live demos."""
    email = DEMO_EMAIL.lower()
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.name = DEMO_NAME
        user.password_hash = hash_password(DEMO_PASSWORD)
    else:
        user = create_user(
            db, name=DEMO_NAME, email=email, password=DEMO_PASSWORD
        )
    db.flush()
    return user


def create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(TOKEN_BYTES)
    expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(
        days=SESSION_DAYS
    )
    db.add(
        AuthSession(
            token=token,
            user_id=user.id,
            created_at=datetime.utcnow(),
            expires_at=expires,
        )
    )
    db.flush()
    return token


def get_user_by_token(db: Session, token: str | None) -> User | None:
    if not token:
        return None
    row = (
        db.query(AuthSession)
        .filter(AuthSession.token == token)
        .first()
    )
    if not row:
        return None
    now = datetime.utcnow()
    if row.expires_at and row.expires_at < now:
        db.delete(row)
        db.commit()
        return None
    return row.user


def revoke_token(db: Session, token: str | None) -> None:
    if not token:
        return
    row = db.query(AuthSession).filter(AuthSession.token == token).first()
    if row:
        db.delete(row)
        db.commit()
