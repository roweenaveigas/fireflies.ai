from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Shared / nested ---


class ParticipantBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: Optional[EmailStr] = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantRead(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class SpeakerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    color: str = Field(default="#F97316", max_length=20)


class SpeakerCreate(SpeakerBase):
    pass


class SpeakerRead(SpeakerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int


class TranscriptLineInput(BaseModel):
    """Structured transcript line for create (speaker by name, not id)."""

    speaker_name: str = Field(..., min_length=1, max_length=120)
    start_time_seconds: float = Field(default=0, ge=0)
    end_time_seconds: float = Field(default=0, ge=0)
    text: str = Field(..., min_length=1)
    order_index: Optional[int] = Field(default=None, ge=0)


class TranscriptLineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    speaker_id: int
    start_time_seconds: float
    end_time_seconds: float
    text: str
    order_index: int
    speaker: Optional[SpeakerRead] = None


class SummaryBase(BaseModel):
    overview_text: str = Field(..., min_length=1)


class SummaryCreate(SummaryBase):
    pass


class SummaryRead(SummaryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    generated_at: datetime


class KeyTopicBase(BaseModel):
    topic_text: str = Field(..., min_length=1, max_length=255)
    order_index: int = Field(default=0, ge=0)


class KeyTopicCreate(KeyTopicBase):
    pass


class KeyTopicRead(KeyTopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int


class ActionItemBase(BaseModel):
    text: str = Field(..., min_length=1)
    assignee: Optional[str] = Field(default=None, max_length=120)
    is_completed: bool = False


class ActionItemCreate(ActionItemBase):
    pass


class ActionItemUpdate(BaseModel):
    text: Optional[str] = Field(default=None, min_length=1)
    assignee: Optional[str] = Field(default=None, max_length=120)
    is_completed: Optional[bool] = None


class ActionItemRead(ActionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    created_at: datetime


# --- Meetings ---


class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    date: datetime
    duration_minutes: int = Field(..., ge=0)


class MeetingCreate(BaseModel):
    """Create a meeting from structured fields and/or pasted transcript text."""

    title: str = Field(..., min_length=1, max_length=255)
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    participant_ids: list[int] = Field(default_factory=list)
    participants: list[ParticipantCreate] = Field(default_factory=list)
    tag_ids: list[int] = Field(default_factory=list)
    tag_names: list[str] = Field(default_factory=list)
    # Pasted plain transcript (e.g. "Maya: Hello\\nJordan: Hi there")
    transcript_text: Optional[str] = None
    # Or structured lines
    transcript_lines: list[TranscriptLineInput] = Field(default_factory=list)
    summary: Optional[SummaryCreate] = None
    key_topics: list[KeyTopicCreate] = Field(default_factory=list)
    action_items: list[ActionItemCreate] = Field(default_factory=list)


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    participant_ids: Optional[list[int]] = None
    participants: Optional[list[ParticipantCreate]] = None
    tag_ids: Optional[list[int]] = None
    tag_names: Optional[list[str]] = None


class MeetingListItem(BaseModel):
    """Lightweight card for the meetings library."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    date: datetime
    duration: int
    duration_minutes: int
    participants: list[ParticipantRead] = Field(default_factory=list)
    tags: list[TagRead] = Field(default_factory=list)
    summary_preview: Optional[str] = None


class HighlightRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    transcript_line_id: int
    created_at: datetime


class HighlightCreate(BaseModel):
    transcript_line_id: int


class CommentCreate(BaseModel):
    transcript_line_id: int
    body: str = Field(..., min_length=1)
    author_name: str = Field(default="You", max_length=120)


class CommentUpdate(BaseModel):
    body: Optional[str] = Field(default=None, min_length=1)


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    transcript_line_id: int
    body: str
    author_name: str
    created_at: datetime
    updated_at: datetime


class SoundbiteCreate(BaseModel):
    transcript_line_id: int
    label: str = Field(..., min_length=1, max_length=255)


class SoundbiteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    transcript_line_id: int
    label: str
    start_time_seconds: float
    end_time_seconds: float
    created_at: datetime


class MeetingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    date: datetime
    duration_minutes: int
    created_at: datetime
    updated_at: datetime
    participants: list[ParticipantRead] = Field(default_factory=list)
    tags: list[TagRead] = Field(default_factory=list)
    speakers: list[SpeakerRead] = Field(default_factory=list)
    transcript_lines: list[TranscriptLineRead] = Field(default_factory=list)
    summary: Optional[SummaryRead] = None
    key_topics: list[KeyTopicRead] = Field(default_factory=list)
    action_items: list[ActionItemRead] = Field(default_factory=list)
    highlights: list[HighlightRead] = Field(default_factory=list)
    comments: list[CommentRead] = Field(default_factory=list)
    soundbites: list[SoundbiteRead] = Field(default_factory=list)


class MeetingListResponse(BaseModel):
    meetings: list[MeetingListItem]
    total: int


class MessageResponse(BaseModel):
    message: str
    id: Optional[int] = None


# --- Search ---


class SearchSnippet(BaseModel):
    meeting_id: int
    meeting_title: str
    line_id: Optional[int] = None
    order_index: Optional[int] = None
    start_time_seconds: Optional[float] = None
    snippet: str
    match_type: str  # title | transcript | participant | action_item | summary | tag


class SearchResponse(BaseModel):
    query: str
    results: list[SearchSnippet]
    total: int


class AskAIRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class AskAIMessage(BaseModel):
    role: str
    content: str


class AskAIResponse(BaseModel):
    answer: str
    mocked: bool = True
    messages: list[AskAIMessage] = Field(default_factory=list)


class TagListResponse(BaseModel):
    tags: list[TagRead]
    total: int