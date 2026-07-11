from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth_utils import (
    DEMO_EMAIL,
    DEMO_NAME,
    DEMO_PASSWORD,
    create_session,
    create_user,
    ensure_demo_user,
    get_user_by_token,
    revoke_token,
    verify_password,
)
from app.db.session import get_db
from app.models import Meeting, User

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    meeting_count: int = 0

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut


def _user_out(db: Session, user: User) -> UserOut:
    count = db.query(Meeting).filter(Meeting.owner_id == user.id).count()
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        meeting_count=count,
    )


def get_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str | None:
    return credentials.credentials if credentials else None


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token),
) -> User:
    user = get_user_by_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


def get_optional_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token),
) -> User | None:
    return get_user_by_token(db, token)


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = str(payload.email).lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = create_user(
        db, name=payload.name, email=email, password=payload.password
    )
    token = create_session(db, user)
    db.commit()
    return AuthResponse(token=token, user=_user_out(db, user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = str(payload.email).lower()
    # Ensure demo account always exists for presentations
    if email == DEMO_EMAIL.lower():
        ensure_demo_user(db)
        db.commit()

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_session(db, user)
    db.commit()
    return AuthResponse(token=token, user=_user_out(db, user))


@router.get("/me", response_model=UserOut)
def me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    return _user_out(db, user)


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    token: str | None = Depends(get_token),
) -> dict:
    revoke_token(db, token)
    return {"status": "ok"}


@router.get("/demo-account")
def demo_account() -> dict:
    """Public hint for evaluators — demo login credentials."""
    return {
        "name": DEMO_NAME,
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "note": "This account is seeded with 6 full sample meetings.",
    }
