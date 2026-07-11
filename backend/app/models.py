from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# --- Association tables ---

meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "participant_id",
        Integer,
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

meeting_tags = Table(
    "meeting_tags",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    participants: Mapped[list[Participant]] = relationship(
        "Participant",
        secondary=meeting_participants,
        back_populates="meetings",
    )
    speakers: Mapped[list[Speaker]] = relationship(
        "Speaker",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    transcript_lines: Mapped[list[TranscriptLine]] = relationship(
        "TranscriptLine",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptLine.order_index",
    )
    summary: Mapped[Optional[Summary]] = relationship(
        "Summary",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
    )
    key_topics: Mapped[list[KeyTopic]] = relationship(
        "KeyTopic",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="KeyTopic.order_index",
    )
    action_items: Mapped[list[ActionItem]] = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    tags: Mapped[list[Tag]] = relationship(
        "Tag",
        secondary=meeting_tags,
        back_populates="meetings",
    )
    highlights: Mapped[list[TranscriptHighlight]] = relationship(
        "TranscriptHighlight",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    comments: Mapped[list[TranscriptComment]] = relationship(
        "TranscriptComment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptComment.created_at",
    )
    soundbites: Mapped[list[Soundbite]] = relationship(
        "Soundbite",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Soundbite.created_at",
    )


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)

    meetings: Mapped[list[Meeting]] = relationship(
        "Meeting",
        secondary=meeting_participants,
        back_populates="participants",
    )


class Speaker(Base):
    __tablename__ = "speakers"
    __table_args__ = (UniqueConstraint("meeting_id", "name", name="uq_speaker_meeting_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#F97316")

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="speakers")
    transcript_lines: Mapped[list[TranscriptLine]] = relationship(
        "TranscriptLine",
        back_populates="speaker",
    )


class TranscriptLine(Base):
    __tablename__ = "transcript_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    speaker_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("speakers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    start_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    end_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="transcript_lines")
    speaker: Mapped[Speaker] = relationship("Speaker", back_populates="transcript_lines")


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    overview_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="summary")


class KeyTopic(Base):
    __tablename__ = "key_topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    topic_text: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="key_topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="action_items")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)

    meetings: Mapped[list[Meeting]] = relationship(
        "Meeting",
        secondary=meeting_tags,
        back_populates="tags",
    )


class TranscriptHighlight(Base):
    __tablename__ = "transcript_highlights"
    __table_args__ = (
        UniqueConstraint(
            "meeting_id", "transcript_line_id", name="uq_highlight_meeting_line"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transcript_line_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("transcript_lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="highlights")
    transcript_line: Mapped[TranscriptLine] = relationship("TranscriptLine")


class TranscriptComment(Base):
    __tablename__ = "transcript_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transcript_line_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("transcript_lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_name: Mapped[str] = mapped_column(String(120), nullable=False, default="You")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="comments")
    transcript_line: Mapped[TranscriptLine] = relationship("TranscriptLine")


class Soundbite(Base):
    __tablename__ = "soundbites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transcript_line_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("transcript_lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    start_time_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    end_time_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="soundbites")
    transcript_line: Mapped[TranscriptLine] = relationship("TranscriptLine")
