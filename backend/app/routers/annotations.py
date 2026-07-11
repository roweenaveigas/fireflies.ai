from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    Soundbite,
    TranscriptComment,
    TranscriptHighlight,
    TranscriptLine,
)
from app.schemas import (
    CommentCreate,
    CommentRead,
    CommentUpdate,
    HighlightCreate,
    HighlightRead,
    MessageResponse,
    SoundbiteCreate,
    SoundbiteRead,
)
from app.services.meetings import get_meeting_or_404

router = APIRouter(prefix="/meetings", tags=["annotations"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_line(db: Session, meeting_id: int, line_id: int) -> TranscriptLine:
    line = (
        db.query(TranscriptLine)
        .filter(TranscriptLine.id == line_id, TranscriptLine.meeting_id == meeting_id)
        .first()
    )
    if not line:
        raise HTTPException(
            status_code=404,
            detail=f"Transcript line {line_id} not found for meeting {meeting_id}",
        )
    return line


@router.post(
    "/{meeting_id}/highlights",
    response_model=HighlightRead,
    status_code=status.HTTP_201_CREATED,
)
def create_highlight(
    meeting_id: int, payload: HighlightCreate, db: Session = Depends(get_db)
) -> HighlightRead:
    get_meeting_or_404(db, meeting_id)
    _get_line(db, meeting_id, payload.transcript_line_id)
    existing = (
        db.query(TranscriptHighlight)
        .filter(
            TranscriptHighlight.meeting_id == meeting_id,
            TranscriptHighlight.transcript_line_id == payload.transcript_line_id,
        )
        .first()
    )
    if existing:
        return HighlightRead.model_validate(existing)
    row = TranscriptHighlight(
        meeting_id=meeting_id,
        transcript_line_id=payload.transcript_line_id,
        created_at=_utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return HighlightRead.model_validate(row)


@router.delete(
    "/{meeting_id}/highlights/{highlight_id}",
    response_model=MessageResponse,
)
def delete_highlight(
    meeting_id: int, highlight_id: int, db: Session = Depends(get_db)
) -> MessageResponse:
    row = (
        db.query(TranscriptHighlight)
        .filter(
            TranscriptHighlight.id == highlight_id,
            TranscriptHighlight.meeting_id == meeting_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Highlight not found")
    db.delete(row)
    db.commit()
    return MessageResponse(message="Highlight removed", id=highlight_id)


@router.post(
    "/{meeting_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    meeting_id: int, payload: CommentCreate, db: Session = Depends(get_db)
) -> CommentRead:
    get_meeting_or_404(db, meeting_id)
    _get_line(db, meeting_id, payload.transcript_line_id)
    now = _utcnow()
    row = TranscriptComment(
        meeting_id=meeting_id,
        transcript_line_id=payload.transcript_line_id,
        body=payload.body.strip(),
        author_name=(payload.author_name or "You").strip() or "You",
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return CommentRead.model_validate(row)


@router.put(
    "/{meeting_id}/comments/{comment_id}",
    response_model=CommentRead,
)
def update_comment(
    meeting_id: int,
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
) -> CommentRead:
    row = (
        db.query(TranscriptComment)
        .filter(
            TranscriptComment.id == comment_id,
            TranscriptComment.meeting_id == meeting_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Comment not found")
    if payload.body is not None:
        row.body = payload.body.strip()
        row.updated_at = _utcnow()
    db.commit()
    db.refresh(row)
    return CommentRead.model_validate(row)


@router.delete(
    "/{meeting_id}/comments/{comment_id}",
    response_model=MessageResponse,
)
def delete_comment(
    meeting_id: int, comment_id: int, db: Session = Depends(get_db)
) -> MessageResponse:
    row = (
        db.query(TranscriptComment)
        .filter(
            TranscriptComment.id == comment_id,
            TranscriptComment.meeting_id == meeting_id,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(row)
    db.commit()
    return MessageResponse(message="Comment deleted", id=comment_id)


@router.post(
    "/{meeting_id}/soundbites",
    response_model=SoundbiteRead,
    status_code=status.HTTP_201_CREATED,
)
def create_soundbite(
    meeting_id: int, payload: SoundbiteCreate, db: Session = Depends(get_db)
) -> SoundbiteRead:
    get_meeting_or_404(db, meeting_id)
    line = _get_line(db, meeting_id, payload.transcript_line_id)
    row = Soundbite(
        meeting_id=meeting_id,
        transcript_line_id=payload.transcript_line_id,
        label=payload.label.strip(),
        start_time_seconds=line.start_time_seconds,
        end_time_seconds=line.end_time_seconds,
        created_at=_utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return SoundbiteRead.model_validate(row)


@router.delete(
    "/{meeting_id}/soundbites/{soundbite_id}",
    response_model=MessageResponse,
)
def delete_soundbite(
    meeting_id: int, soundbite_id: int, db: Session = Depends(get_db)
) -> MessageResponse:
    row = (
        db.query(Soundbite)
        .filter(Soundbite.id == soundbite_id, Soundbite.meeting_id == meeting_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Soundbite not found")
    db.delete(row)
    db.commit()
    return MessageResponse(message="Soundbite deleted", id=soundbite_id)
