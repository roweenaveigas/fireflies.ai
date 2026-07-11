from __future__ import annotations

import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ActionItem, Summary, TranscriptLine
from app.schemas import AskAIMessage, AskAIRequest, AskAIResponse
from app.services.meetings import get_meeting_or_404

router = APIRouter(prefix="/meetings", tags=["ask-ai"])


def _build_context(meeting) -> str:
    parts: list[str] = [
        f"Meeting title: {meeting.title}",
        f"Participants: {', '.join(p.name for p in meeting.participants) or 'None'}",
    ]
    if meeting.summary:
        parts.append(f"Summary: {meeting.summary.overview_text}")
    if meeting.key_topics:
        topics = "; ".join(t.topic_text for t in meeting.key_topics)
        parts.append(f"Key topics: {topics}")
    if meeting.action_items:
        actions = "; ".join(
            f"{a.text}" + (f" (assignee: {a.assignee})" if a.assignee else "")
            for a in meeting.action_items
        )
        parts.append(f"Action items: {actions}")
    lines = meeting.transcript_lines[:80]
    if lines:
        transcript = "\n".join(
            f"[{line.start_time_seconds:.0f}s] "
            f"{(line.speaker.name if line.speaker else 'Speaker')}: {line.text}"
            for line in lines
        )
        parts.append(f"Transcript excerpt:\n{transcript}")
    return "\n\n".join(parts)


def _mock_answer(meeting, question: str) -> str:
    q = question.lower()
    actions = meeting.action_items or []
    summary = meeting.summary.overview_text if meeting.summary else None

    # Assignee-focused action items
    name_match = re.search(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b", question)
    if "action" in q:
        if name_match:
            name = name_match.group(1)
            owned = [
                a
                for a in actions
                if a.assignee and name.lower() in a.assignee.lower()
            ]
            if owned:
                bullets = "\n".join(f"- {a.text}" for a in owned)
                return (
                    f"Based on this meeting, here are action items related to "
                    f"**{name}**:\n{bullets}"
                )
        if actions:
            bullets = "\n".join(
                f"- {a.text}" + (f" — {a.assignee}" if a.assignee else "")
                for a in actions
            )
            return f"Here are the action items from **{meeting.title}**:\n{bullets}"
        return "I don't see any action items recorded for this meeting yet."

    if "decision" in q or "decided" in q:
        topics = [t.topic_text for t in (meeting.key_topics or [])]
        if topics:
            bullets = "\n".join(f"- {t}" for t in topics[:5])
            return (
                f"Key discussion themes that likely drove decisions:\n{bullets}\n\n"
                + (f"Overview: {summary}" if summary else "")
            ).strip()
        if summary:
            return f"From the summary: {summary}"
        return "No explicit decisions were tagged. Check the transcript for verbal agreements."

    if "blocker" in q or "block" in q:
        hits = [
            line
            for line in meeting.transcript_lines
            if any(
                w in line.text.lower()
                for w in ("block", "stuck", "waiting", "risk", "issue")
            )
        ][:5]
        if hits:
            bullets = "\n".join(
                f"- {(line.speaker.name if line.speaker else 'Speaker')}: {line.text}"
                for line in hits
            )
            return f"Possible blockers mentioned in the transcript:\n{bullets}"
        return "I didn't find clear blocker language in the transcript excerpt."

    if "summar" in q:
        if summary:
            return summary
        return f"**{meeting.title}** has no stored summary yet."

    # Default: blend summary + top actions
    bits: list[str] = []
    if summary:
        bits.append(summary)
    if actions:
        bits.append(
            "Top action items:\n"
            + "\n".join(f"- {a.text}" for a in actions[:4])
        )
    if not bits:
        bits.append(
            f"I reviewed **{meeting.title}**. Ask about action items, decisions, "
            "or blockers for a more specific answer."
        )
    return "\n\n".join(bits)


def _openai_answer(context: str, question: str) -> Optional[str]:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("FIREFLIES_OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        import urllib.request
        import json

        body = json.dumps(
            {
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are Fireflies AskFred. Answer concisely using only "
                            "the meeting context provided. If unknown, say so."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Context:\n{context}\n\nQuestion: {question}",
                    },
                ],
                "temperature": 0.3,
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


@router.post("/{meeting_id}/ask", response_model=AskAIResponse)
def ask_about_meeting(
    meeting_id: int, payload: AskAIRequest, db: Session = Depends(get_db)
) -> AskAIResponse:
    meeting = get_meeting_or_404(db, meeting_id)
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    context = _build_context(meeting)
    live = _openai_answer(context, question)
    if live:
        answer = live
        mocked = False
    else:
        answer = _mock_answer(meeting, question)
        mocked = True

    return AskAIResponse(
        answer=answer,
        mocked=mocked,
        messages=[
            AskAIMessage(role="user", content=question),
            AskAIMessage(role="assistant", content=answer),
        ],
    )
