from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ActionItem, Meeting
from app.schemas import ActionItemCreate, ActionItemRead, ActionItemUpdate, MessageResponse

router = APIRouter(prefix="/meetings", tags=["action-items"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _get_meeting(db: Session, meeting_id: int) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")
    return meeting


def _get_action_item(db: Session, meeting_id: int, item_id: int) -> ActionItem:
    item = (
        db.query(ActionItem)
        .filter(ActionItem.id == item_id, ActionItem.meeting_id == meeting_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Action item {item_id} not found for meeting {meeting_id}",
        )
    return item


@router.post(
    "/{meeting_id}/action-items",
    response_model=ActionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: int,
    payload: ActionItemCreate,
    db: Session = Depends(get_db),
) -> ActionItemRead:
    _get_meeting(db, meeting_id)
    item = ActionItem(
        meeting_id=meeting_id,
        text=payload.text.strip(),
        assignee=payload.assignee,
        is_completed=payload.is_completed,
        created_at=_utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ActionItemRead.model_validate(item)


@router.put(
    "/{meeting_id}/action-items/{item_id}",
    response_model=ActionItemRead,
)
def update_action_item(
    meeting_id: int,
    item_id: int,
    payload: ActionItemUpdate,
    db: Session = Depends(get_db),
) -> ActionItemRead:
    item = _get_action_item(db, meeting_id, item_id)
    if payload.text is not None:
        item.text = payload.text.strip()
    if payload.assignee is not None:
        item.assignee = payload.assignee
    if payload.is_completed is not None:
        item.is_completed = payload.is_completed
    db.commit()
    db.refresh(item)
    return ActionItemRead.model_validate(item)


@router.delete(
    "/{meeting_id}/action-items/{item_id}",
    response_model=MessageResponse,
)
def delete_action_item(
    meeting_id: int,
    item_id: int,
    db: Session = Depends(get_db),
) -> MessageResponse:
    item = _get_action_item(db, meeting_id, item_id)
    db.delete(item)
    db.commit()
    return MessageResponse(message="Action item deleted", id=item_id)
