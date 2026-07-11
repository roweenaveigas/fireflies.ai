from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import (
    ActionItem,
    Meeting,
    Participant,
    Summary,
    Tag,
    TranscriptLine,
    User,
)
from app.routers.auth import get_current_user
from app.schemas import SearchResponse, SearchSnippet, TagListResponse, TagRead

router = APIRouter(tags=["search"])

SNIPPET_RADIUS = 60


def _snippet(text: str, query: str) -> str:
    lower = text.lower()
    idx = lower.find(query.lower())
    if idx < 0:
        compact = " ".join(text.split())
        return compact if len(compact) <= 140 else compact[:139] + "…"
    start = max(0, idx - SNIPPET_RADIUS)
    end = min(len(text), idx + len(query) + SNIPPET_RADIUS)
    piece = text[start:end].strip()
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return f"{prefix}{piece}{suffix}"


@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(..., min_length=1, description="Search meetings, transcripts, people, actions"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SearchResponse:
    term = q.strip()
    if not term:
        return SearchResponse(query=q, results=[], total=0)

    like = f"%{term}%"
    results: list[SearchSnippet] = []
    owned = Meeting.owner_id == user.id

    title_hits = (
        db.query(Meeting)
        .filter(owned, Meeting.title.ilike(like))
        .order_by(Meeting.date.desc())
        .all()
    )
    for meeting in title_hits:
        results.append(
            SearchSnippet(
                meeting_id=meeting.id,
                meeting_title=meeting.title,
                snippet=meeting.title,
                match_type="title",
            )
        )

    participant_hits = (
        db.query(Meeting)
        .join(Meeting.participants)
        .filter(owned, Participant.name.ilike(like))
        .order_by(Meeting.date.desc())
        .distinct()
        .all()
    )
    for meeting in participant_hits:
        names = [p.name for p in meeting.participants if term.lower() in p.name.lower()]
        results.append(
            SearchSnippet(
                meeting_id=meeting.id,
                meeting_title=meeting.title,
                snippet=", ".join(names) or term,
                match_type="participant",
            )
        )

    summary_hits = (
        db.query(Summary)
        .options(joinedload(Summary.meeting))
        .join(Summary.meeting)
        .filter(owned, Summary.overview_text.ilike(like))
        .limit(40)
        .all()
    )
    for row in summary_hits:
        results.append(
            SearchSnippet(
                meeting_id=row.meeting_id,
                meeting_title=row.meeting.title,
                snippet=_snippet(row.overview_text, term),
                match_type="summary",
            )
        )

    action_hits = (
        db.query(ActionItem)
        .options(joinedload(ActionItem.meeting))
        .join(ActionItem.meeting)
        .filter(owned, ActionItem.text.ilike(like))
        .limit(40)
        .all()
    )
    for row in action_hits:
        results.append(
            SearchSnippet(
                meeting_id=row.meeting_id,
                meeting_title=row.meeting.title,
                snippet=_snippet(row.text, term),
                match_type="action_item",
            )
        )

    tag_hits = (
        db.query(Meeting)
        .join(Meeting.tags)
        .filter(owned, Tag.name.ilike(like))
        .order_by(Meeting.date.desc())
        .distinct()
        .all()
    )
    for meeting in tag_hits:
        names = [t.name for t in meeting.tags if term.lower() in t.name.lower()]
        results.append(
            SearchSnippet(
                meeting_id=meeting.id,
                meeting_title=meeting.title,
                snippet=", ".join(names) or term,
                match_type="tag",
            )
        )

    line_hits = (
        db.query(TranscriptLine)
        .options(joinedload(TranscriptLine.meeting))
        .join(TranscriptLine.meeting)
        .filter(owned, TranscriptLine.text.ilike(like))
        .order_by(TranscriptLine.meeting_id, TranscriptLine.order_index)
        .limit(100)
        .all()
    )
    for line in line_hits:
        meeting = line.meeting
        results.append(
            SearchSnippet(
                meeting_id=meeting.id,
                meeting_title=meeting.title,
                line_id=line.id,
                order_index=line.order_index,
                start_time_seconds=line.start_time_seconds,
                snippet=_snippet(line.text, term),
                match_type="transcript",
            )
        )

    return SearchResponse(query=term, results=results, total=len(results))


@router.get("/tags", response_model=TagListResponse)
def list_tags(db: Session = Depends(get_db)) -> TagListResponse:
    tags = db.query(Tag).order_by(Tag.name.asc()).all()
    return TagListResponse(
        tags=[TagRead.model_validate(t) for t in tags],
        total=len(tags),
    )
