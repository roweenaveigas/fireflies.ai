from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    ActionItem,
    KeyTopic,
    Meeting,
    Participant,
    Speaker,
    Summary,
    Tag,
    TranscriptLine,
)
from app.schemas import (
    MeetingCreate,
    MeetingDetail,
    MeetingListResponse,
    MeetingUpdate,
    MessageResponse,
    TranscriptLineInput,
)
from app.services.meetings import (
    SPEAKER_COLORS,
    get_meeting_or_404,
    meeting_list_options,
    parse_transcript_text,
    to_detail,
    to_list_item,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_or_create_participant(
    db: Session, *, name: str, email: Optional[str] = None
) -> Participant:
    if email:
        existing = db.query(Participant).filter(Participant.email == email).first()
        if existing:
            return existing
    existing = (
        db.query(Participant)
        .filter(Participant.name == name, Participant.email.is_(None))
        .first()
    )
    if existing and not email:
        return existing
    participant = Participant(name=name, email=email)
    db.add(participant)
    db.flush()
    return participant


def _resolve_participants(db: Session, payload: MeetingCreate) -> list[Participant]:
    found: dict[int, Participant] = {}
    if payload.participant_ids:
        rows = (
            db.query(Participant)
            .filter(Participant.id.in_(payload.participant_ids))
            .all()
        )
        missing = set(payload.participant_ids) - {p.id for p in rows}
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown participant_ids: {sorted(missing)}",
            )
        for p in rows:
            found[p.id] = p
    for item in payload.participants:
        p = _get_or_create_participant(db, name=item.name, email=item.email)
        found[p.id] = p
    return list(found.values())


def _resolve_tags(db: Session, payload: MeetingCreate) -> list[Tag]:
    found: dict[int, Tag] = {}
    if payload.tag_ids:
        rows = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        missing = set(payload.tag_ids) - {t.id for t in rows}
        if missing:
            raise HTTPException(
                status_code=400, detail=f"Unknown tag_ids: {sorted(missing)}"
            )
        for t in rows:
            found[t.id] = t
    for name in payload.tag_names:
        clean = name.strip()
        if not clean:
            continue
        tag = db.query(Tag).filter(Tag.name == clean).first()
        if not tag:
            tag = Tag(name=clean)
            db.add(tag)
            db.flush()
        found[tag.id] = tag
    return list(found.values())


def _build_transcript_inputs(payload: MeetingCreate) -> list[TranscriptLineInput]:
    if payload.transcript_lines:
        return list(payload.transcript_lines)
    if payload.transcript_text and payload.transcript_text.strip():
        parsed = parse_transcript_text(payload.transcript_text)
        lines: list[TranscriptLineInput] = []
        cursor = 0.0
        for i, (speaker_name, text) in enumerate(parsed):
            # ~6s per line as a reasonable default for pasted text
            duration = max(4.0, min(12.0, len(text.split()) * 0.45))
            start = cursor
            end = cursor + duration
            lines.append(
                TranscriptLineInput(
                    speaker_name=speaker_name,
                    start_time_seconds=round(start, 2),
                    end_time_seconds=round(end, 2),
                    text=text,
                    order_index=i,
                )
            )
            cursor = end
        return lines
    return []


def _attach_transcript(
    db: Session, meeting: Meeting, lines: list[TranscriptLineInput]
) -> None:
    if not lines:
        return
    speakers: dict[str, Speaker] = {}
    color_i = 0
    for line in lines:
        name = line.speaker_name.strip()
        if name not in speakers:
            speakers[name] = Speaker(
                meeting_id=meeting.id,
                name=name,
                color=SPEAKER_COLORS[color_i % len(SPEAKER_COLORS)],
            )
            db.add(speakers[name])
            color_i += 1
    db.flush()

    for i, line in enumerate(lines):
        start = line.start_time_seconds
        end = line.end_time_seconds if line.end_time_seconds > start else start + 5
        db.add(
            TranscriptLine(
                meeting_id=meeting.id,
                speaker_id=speakers[line.speaker_name.strip()].id,
                start_time_seconds=start,
                end_time_seconds=end,
                text=line.text,
                order_index=line.order_index if line.order_index is not None else i,
            )
        )


@router.get("/", response_model=MeetingListResponse)
def list_meetings(
    q: Optional[str] = Query(
        None, description="Search by meeting title or participant name"
    ),
    date_from: Optional[datetime] = Query(None, description="Inclusive start date"),
    date_to: Optional[datetime] = Query(None, description="Inclusive end date"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    sort: str = Query("recency", pattern="^(recency|oldest)$"),
    db: Session = Depends(get_db),
) -> MeetingListResponse:
    query = db.query(Meeting).options(*meeting_list_options())

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = (
            query.outerjoin(Meeting.participants)
            .filter(
                or_(
                    Meeting.title.ilike(term),
                    Participant.name.ilike(term),
                )
            )
            .distinct()
        )

    if tag and tag.strip():
        query = (
            query.join(Meeting.tags)
            .filter(Tag.name.ilike(tag.strip()))
            .distinct()
        )

    if date_from is not None:
        query = query.filter(Meeting.date >= date_from)
    if date_to is not None:
        query = query.filter(Meeting.date <= date_to)

    if sort == "oldest":
        query = query.order_by(Meeting.date.asc())
    else:
        query = query.order_by(Meeting.date.desc())

    meetings = query.all()
    items = [to_list_item(m) for m in meetings]
    return MeetingListResponse(meetings=items, total=len(items))


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)) -> MeetingDetail:
    meeting = get_meeting_or_404(db, meeting_id)
    return to_detail(meeting)


@router.post("/", response_model=MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate, db: Session = Depends(get_db)
) -> MeetingDetail:
    now = _utcnow()
    lines = _build_transcript_inputs(payload)

    duration = payload.duration_minutes
    if duration is None:
        if lines:
            duration = max(1, int(lines[-1].end_time_seconds // 60) + 1)
        else:
            duration = 0

    meeting = Meeting(
        title=payload.title.strip(),
        date=payload.date or now,
        duration_minutes=duration,
        created_at=now,
        updated_at=now,
    )
    meeting.participants = _resolve_participants(db, payload)
    meeting.tags = _resolve_tags(db, payload)
    db.add(meeting)
    db.flush()

    _attach_transcript(db, meeting, lines)

    if payload.summary:
        db.add(
            Summary(
                meeting_id=meeting.id,
                overview_text=payload.summary.overview_text,
                generated_at=now,
            )
        )

    for topic in payload.key_topics:
        db.add(
            KeyTopic(
                meeting_id=meeting.id,
                topic_text=topic.topic_text,
                order_index=topic.order_index,
            )
        )

    for item in payload.action_items:
        db.add(
            ActionItem(
                meeting_id=meeting.id,
                text=item.text,
                assignee=item.assignee,
                is_completed=item.is_completed,
                created_at=now,
            )
        )

    # If participants weren't provided, derive from transcript speakers
    if not meeting.participants and lines:
        names = []
        seen: set[str] = set()
        for line in lines:
            n = line.speaker_name.strip()
            if n.lower() == "speaker" or n in seen:
                continue
            seen.add(n)
            names.append(n)
        meeting.participants = [
            _get_or_create_participant(db, name=n) for n in names
        ]

    db.commit()
    return to_detail(get_meeting_or_404(db, meeting.id))


@router.put("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(
    meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)
) -> MeetingDetail:
    meeting = get_meeting_or_404(db, meeting_id)

    if payload.title is not None:
        meeting.title = payload.title.strip()
    if payload.date is not None:
        meeting.date = payload.date
    if payload.duration_minutes is not None:
        meeting.duration_minutes = payload.duration_minutes

    if payload.participant_ids is not None:
        rows = (
            db.query(Participant)
            .filter(Participant.id.in_(payload.participant_ids))
            .all()
        )
        missing = set(payload.participant_ids) - {p.id for p in rows}
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown participant_ids: {sorted(missing)}",
            )
        meeting.participants = rows

    if payload.participants is not None:
        resolved: list[Participant] = []
        seen: set[int] = set()
        for item in payload.participants:
            name = item.name.strip()
            if not name:
                continue
            p = _get_or_create_participant(db, name=name, email=item.email)
            if p.id not in seen:
                seen.add(p.id)
                resolved.append(p)
        meeting.participants = resolved

    if payload.tag_ids is not None:
        rows = db.query(Tag).filter(Tag.id.in_(payload.tag_ids)).all()
        missing = set(payload.tag_ids) - {t.id for t in rows}
        if missing:
            raise HTTPException(
                status_code=400, detail=f"Unknown tag_ids: {sorted(missing)}"
            )
        meeting.tags = rows

    if payload.tag_names is not None:
        found: dict[int, Tag] = {}
        for name in payload.tag_names:
            clean = name.strip()
            if not clean:
                continue
            tag = db.query(Tag).filter(Tag.name == clean).first()
            if not tag:
                tag = Tag(name=clean)
                db.add(tag)
                db.flush()
            found[tag.id] = tag
        meeting.tags = list(found.values())

    meeting.updated_at = _utcnow()
    db.commit()
    return to_detail(get_meeting_or_404(db, meeting_id))


@router.delete("/{meeting_id}", response_model=MessageResponse)
def delete_meeting(
    meeting_id: int, db: Session = Depends(get_db)
) -> MessageResponse:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    db.delete(meeting)
    db.commit()
    return MessageResponse(message="Meeting deleted", id=meeting_id)
