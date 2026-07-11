"""Shared helpers for meeting serialization and loading."""

from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Meeting, TranscriptLine
from app.schemas import MeetingDetail, MeetingListItem, ParticipantRead, TagRead

SUMMARY_PREVIEW_LEN = 160

SPEAKER_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4"]


def summary_preview(overview: str | None) -> str | None:
    if not overview:
        return None
    text = " ".join(overview.split())
    if len(text) <= SUMMARY_PREVIEW_LEN:
        return text
    return text[: SUMMARY_PREVIEW_LEN - 1].rstrip() + "…"


def meeting_list_options():
    return (
        joinedload(Meeting.participants),
        joinedload(Meeting.summary),
        joinedload(Meeting.tags),
    )


def meeting_detail_options():
    return (
        selectinload(Meeting.participants),
        selectinload(Meeting.tags),
        selectinload(Meeting.speakers),
        selectinload(Meeting.transcript_lines).joinedload(TranscriptLine.speaker),
        selectinload(Meeting.summary),
        selectinload(Meeting.key_topics),
        selectinload(Meeting.action_items),
        selectinload(Meeting.highlights),
        selectinload(Meeting.comments),
        selectinload(Meeting.soundbites),
    )


def get_meeting_or_404(db: Session, meeting_id: int) -> Meeting:
    meeting = (
        db.query(Meeting)
        .options(*meeting_detail_options())
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    return meeting


def to_list_item(meeting: Meeting) -> MeetingListItem:
    overview = meeting.summary.overview_text if meeting.summary else None
    return MeetingListItem(
        id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        duration=meeting.duration_minutes,
        duration_minutes=meeting.duration_minutes,
        participants=[ParticipantRead.model_validate(p) for p in meeting.participants],
        tags=[TagRead.model_validate(t) for t in meeting.tags],
        summary_preview=summary_preview(overview),
    )


def to_detail(meeting: Meeting) -> MeetingDetail:
    return MeetingDetail.model_validate(meeting)


def parse_transcript_text(text: str) -> list[tuple[str, str]]:
    """Parse pasted transcript into (speaker_name, line_text) pairs."""
    rows: list[tuple[str, str]] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if ":" in line:
            name, _, body = line.partition(":")
            name = name.strip()
            body = body.strip()
            if name and body and len(name) <= 80 and not name.startswith("http"):
                rows.append((name, body))
                continue
        rows.append(("Speaker", line))
    return rows
