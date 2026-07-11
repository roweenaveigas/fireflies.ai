"""Seed SQLite with 6 realistic sample meetings.

Idempotent: safe to run multiple times (wipes existing rows first).

Usage (from backend/):
    python -m app.seed
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable, TypeVar

from sqlalchemy import text

from app.db.session import SessionLocal, engine, Base, DATABASE_URL
from app.models import (
    ActionItem,
    KeyTopic,
    Meeting,
    Participant,
    Speaker,
    Summary,
    Tag,
    TranscriptLine,
    meeting_participants,
    meeting_tags,
)

T = TypeVar("T")

SPEAKER_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4"]


def _dedupe(items: Iterable[T]) -> list[T]:
    """Preserve order while dropping duplicate object identities."""
    seen: set[int] = set()
    out: list[T] = []
    for item in items:
        key = id(item)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _lines(
    meeting: Meeting,
    speakers: dict[str, Speaker],
    rows: list[tuple[str, float, float, str]],
) -> list[TranscriptLine]:
    """rows: (speaker_name, start_s, end_s, text)"""
    out: list[TranscriptLine] = []
    for i, (name, start, end, text_body) in enumerate(rows):
        out.append(
            TranscriptLine(
                meeting=meeting,
                speaker=speakers[name],
                start_time_seconds=start,
                end_time_seconds=end,
                text=text_body,
                order_index=i,
            )
        )
    return out


def clear_db(db) -> None:
    """Remove all seeded rows, including M2M association tables.

    Association tables are deleted explicitly — ORM meeting deletes alone can
    leave orphan meeting_participants rows on SQLite, which then collide on re-seed.
    """
    # Ensure FK cascades are honored for any remaining ORM deletes
    db.execute(text("PRAGMA foreign_keys=ON"))

    db.execute(meeting_participants.delete())
    db.execute(meeting_tags.delete())
    db.query(TranscriptLine).delete()
    db.query(ActionItem).delete()
    db.query(KeyTopic).delete()
    db.query(Summary).delete()
    db.query(Speaker).delete()
    db.query(Meeting).delete()
    db.query(Participant).delete()
    db.query(Tag).delete()
    db.commit()


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clear_db(db)

        # --- Shared people ---
        people = {
            "maya": Participant(name="Maya Chen", email="maya.chen@acme.io"),
            "jordan": Participant(name="Jordan Blake", email="jordan.blake@acme.io"),
            "sam": Participant(name="Sam Okonkwo", email="sam.okonkwo@acme.io"),
            "priya": Participant(name="Priya Nair", email="priya.nair@acme.io"),
            "alex": Participant(name="Alex Rivera", email="alex.rivera@acme.io"),
            "chris": Participant(name="Chris Patel", email="chris.patel@acme.io"),
            "lena": Participant(name="Lena Vogt", email="lena@northwind.co"),
            "tom": Participant(name="Tom Harris", email="tom.harris@northwind.co"),
            "nina": Participant(name="Nina Brooks", email="nina.brooks@acme.io"),
        }
        for p in people.values():
            db.add(p)
        db.flush()

        tags = {
            "standup": Tag(name="standup"),
            "client": Tag(name="client"),
            "1:1": Tag(name="1:1"),
            "planning": Tag(name="planning"),
            "sales": Tag(name="sales"),
            "design": Tag(name="design"),
            "engineering": Tag(name="engineering"),
        }
        for t in tags.values():
            db.add(t)
        db.flush()

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # ========== 1. Engineering standup ==========
        m1 = Meeting(
            title="Engineering Standup — Platform Team",
            date=now - timedelta(days=1, hours=2),
            duration_minutes=18,
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
        )
        m1.participants = _dedupe(
            [people["maya"], people["jordan"], people["sam"], people["priya"]]
        )
        m1.tags = _dedupe([tags["standup"], tags["engineering"]])
        db.add(m1)
        db.flush()

        s1 = {
            "Maya Chen": Speaker(meeting_id=m1.id, name="Maya Chen", color=SPEAKER_COLORS[0]),
            "Jordan Blake": Speaker(meeting_id=m1.id, name="Jordan Blake", color=SPEAKER_COLORS[1]),
            "Sam Okonkwo": Speaker(meeting_id=m1.id, name="Sam Okonkwo", color=SPEAKER_COLORS[2]),
            "Priya Nair": Speaker(meeting_id=m1.id, name="Priya Nair", color=SPEAKER_COLORS[3]),
        }
        for sp in s1.values():
            db.add(sp)
        db.flush()

        m1.transcript_lines = _lines(
            m1,
            s1,
            [
                ("Maya Chen", 0, 8, "Morning everyone. Let's keep this tight — blockers first, then updates."),
                ("Jordan Blake", 8, 22, "I'm finishing the webhook retry queue. Tests are green locally; waiting on staging deploy."),
                ("Sam Okonkwo", 22, 38, "I hit a flake in the CI pipeline for the transcript parser. Looking like a race in the fixture teardown."),
                ("Priya Nair", 38, 52, "Design tokens PR is ready for review. Also synced with product on the empty-state copy."),
                ("Maya Chen", 52, 65, "Jordan, can you pair with Sam after this if the flake blocks the release branch?"),
                ("Jordan Blake", 65, 78, "Yeah, I can jump on that around 11. Sam, drop the failing job link in Slack."),
                ("Sam Okonkwo", 78, 95, "Will do. Separately — the search index rebuild took 14 minutes last night. We should chunk it."),
                ("Priya Nair", 95, 110, "On the UI side, the meetings list filter by participant is done. Still need date-range."),
                ("Maya Chen", 110, 128, "Prioritize date-range today. Client demo is Thursday and they'll want to find last week's calls."),
                ("Jordan Blake", 128, 145, "Quick heads-up: Redis memory on staging is at 78%. I'll bump the eviction policy after standup."),
                ("Sam Okonkwo", 145, 162, "Also merged the Alembic migration for action_items.is_completed. No downtime needed."),
                ("Priya Nair", 162, 178, "One more — accessibility pass on the seek bar. Keyboard focus was skipping the transcript panel."),
                ("Maya Chen", 178, 195, "Nice. Any other blockers?"),
                ("Jordan Blake", 195, 208, "Need a decision on whether we keep VTT upload or only JSON for transcripts."),
                ("Maya Chen", 208, 230, "Support both for now. JSON is canonical; VTT converts on ingest. I'll note it in the RFC."),
                ("Sam Okonkwo", 230, 248, "Cool. I'll add a converter stub this afternoon so we're not blocked."),
                ("Priya Nair", 248, 265, "I'll ship date-range filter and then help with empty states if there's time."),
                ("Maya Chen", 265, 285, "Perfect. Retro is Friday at 3. Please add topics to the doc before then. Thanks all."),
                ("Jordan Blake", 285, 295, "Sounds good. Catch you later."),
                ("Sam Okonkwo", 295, 305, "Later."),
                ("Priya Nair", 305, 312, "Bye!"),
                ("Maya Chen", 312, 320, "Standup done — back to it."),
            ],
        )
        m1.summary = Summary(
            meeting_id=m1.id,
            overview_text=(
                "The platform team reviewed progress on webhook retries, CI flakiness in the transcript "
                "parser, and UI filters for the meetings library. Maya asked Jordan to help Sam unblock "
                "the release branch and prioritized the date-range filter ahead of Thursday's client demo. "
                "The team agreed to accept both VTT and JSON transcript uploads, with JSON as the "
                "canonical format. Redis memory on staging and an accessibility fix for the seek bar were "
                "also called out."
            ),
            generated_at=now - timedelta(days=1),
        )
        m1.key_topics = [
            KeyTopic(meeting_id=m1.id, topic_text="Webhook retry queue & staging deploy", order_index=0),
            KeyTopic(meeting_id=m1.id, topic_text="CI flake in transcript parser", order_index=1),
            KeyTopic(meeting_id=m1.id, topic_text="Meetings list date-range filter", order_index=2),
            KeyTopic(meeting_id=m1.id, topic_text="Transcript upload formats (VTT vs JSON)", order_index=3),
            KeyTopic(meeting_id=m1.id, topic_text="Staging Redis memory & a11y seek bar", order_index=4),
        ]
        m1.action_items = [
            ActionItem(meeting_id=m1.id, text="Pair on CI flake blocking release branch", assignee="Jordan Blake", is_completed=False),
            ActionItem(meeting_id=m1.id, text="Ship date-range filter on meetings list", assignee="Priya Nair", is_completed=False),
            ActionItem(meeting_id=m1.id, text="Bump Redis eviction policy on staging", assignee="Jordan Blake", is_completed=True),
            ActionItem(meeting_id=m1.id, text="Add VTT→JSON converter stub", assignee="Sam Okonkwo", is_completed=False),
            ActionItem(meeting_id=m1.id, text="Document dual-format transcript ingest in RFC", assignee="Maya Chen", is_completed=False),
        ]

        # ========== 2. Client call ==========
        m2 = Meeting(
            title="Northwind QBR — Product Walkthrough",
            date=now - timedelta(days=3, hours=4),
            duration_minutes=42,
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=3),
        )
        m2.participants = _dedupe(
            [people["alex"], people["priya"], people["lena"], people["tom"]]
        )
        m2.tags = _dedupe([tags["client"]])
        db.add(m2)
        db.flush()

        s2 = {
            "Alex Rivera": Speaker(meeting_id=m2.id, name="Alex Rivera", color=SPEAKER_COLORS[0]),
            "Priya Nair": Speaker(meeting_id=m2.id, name="Priya Nair", color=SPEAKER_COLORS[3]),
            "Lena Vogt": Speaker(meeting_id=m2.id, name="Lena Vogt", color=SPEAKER_COLORS[1]),
            "Tom Harris": Speaker(meeting_id=m2.id, name="Tom Harris", color=SPEAKER_COLORS[2]),
        }
        for sp in s2.values():
            db.add(sp)
        db.flush()

        m2.transcript_lines = _lines(
            m2,
            s2,
            [
                ("Alex Rivera", 0, 15, "Thanks for joining, Lena and Tom. We'll walk through the new summary workspace and then open it up for questions."),
                ("Lena Vogt", 15, 28, "Appreciate it. Our CS team has been asking for clearer action-item ownership, so that's top of mind."),
                ("Priya Nair", 28, 48, "I'll share my screen. Here's the meetings library — search by title, participant, or date. Cards show duration and attendees."),
                ("Tom Harris", 48, 62, "Can we filter by account or tag? We have dozens of calls a week across regions."),
                ("Priya Nair", 62, 80, "Tags are supported today. Account-level filtering is on the roadmap for next sprint — we can prioritize if it's a blocker."),
                ("Alex Rivera", 80, 98, "We'll note that as a must-have for your rollout. Priya, show the detail view next."),
                ("Priya Nair", 98, 125, "On the right: AI summary, key topics, and action items. On the left: interactive transcript. Click a line and the player seeks to that timestamp."),
                ("Lena Vogt", 125, 145, "Love the sync. One ask — can assignees map to our Slack handles, not just free text?"),
                ("Alex Rivera", 145, 165, "Not in this release, but we can export action items to CSV and you're already piping that into Asana."),
                ("Tom Harris", 165, 185, "That works short-term. Also, how accurate are the summaries on noisy sales calls?"),
                ("Alex Rivera", 185, 210, "On seeded and uploaded transcripts we're seeing strong structure. Live STT is out of scope for this phase; quality depends on the source transcript."),
                ("Lena Vogt", 210, 230, "Understood. For pilot we'd upload Zoom VTT files from our AE team."),
                ("Priya Nair", 230, 250, "Perfect — VTT ingest is supported. I'll send a short guide after this call."),
                ("Tom Harris", 250, 275, "Security question: where does audio live? We can't store customer recordings outside our VPC indefinitely."),
                ("Alex Rivera", 275, 305, "Audio can be a placeholder or customer-hosted URL. We persist transcript text and metadata in your instance's database."),
                ("Lena Vogt", 305, 325, "That helps. Let's pilot with five AE seats starting Monday. Can we get SSO later?"),
                ("Alex Rivera", 325, 345, "SSO is planned for enterprise. For pilot we'll use invite links. I'll send a proposal by EOD tomorrow."),
                ("Priya Nair", 345, 365, "I'll also schedule a 30-minute enablement for your CS leads next week."),
                ("Tom Harris", 365, 380, "Great. One more — export to PDF for QBRs?"),
                ("Priya Nair", 380, 395, "Markdown and TXT export ship first; PDF is a bonus we're scoping now."),
                ("Lena Vogt", 395, 410, "Markdown is fine for the pilot. Thanks for the walkthrough."),
                ("Alex Rivera", 410, 425, "Thank you both. We'll follow up with the proposal, VTT guide, and enablement invite."),
                ("Tom Harris", 425, 435, "Sounds good. Talk soon."),
                ("Priya Nair", 435, 445, "Bye everyone."),
                ("Lena Vogt", 445, 452, "Bye!"),
            ],
        )
        m2.summary = Summary(
            meeting_id=m2.id,
            overview_text=(
                "Alex and Priya walked Northwind through the meetings library and interactive transcript "
                "detail view. Lena emphasized action-item ownership for CS, while Tom requested "
                "account-level filtering and clarified security constraints around audio storage. "
                "The parties agreed to a five-seat AE pilot starting Monday using Zoom VTT uploads, "
                "with CSV export as a temporary bridge to Asana. Alex will send a commercial proposal "
                "and Priya will provide a VTT guide plus enablement for CS leads."
            ),
            generated_at=now - timedelta(days=3),
        )
        m2.key_topics = [
            KeyTopic(meeting_id=m2.id, topic_text="Meetings library & search/filter demo", order_index=0),
            KeyTopic(meeting_id=m2.id, topic_text="Transcript–player timestamp sync", order_index=1),
            KeyTopic(meeting_id=m2.id, topic_text="Action items & Asana/CSV workflow", order_index=2),
            KeyTopic(meeting_id=m2.id, topic_text="Audio storage & security constraints", order_index=3),
            KeyTopic(meeting_id=m2.id, topic_text="Pilot scope: 5 AE seats + VTT ingest", order_index=4),
        ]
        m2.action_items = [
            ActionItem(meeting_id=m2.id, text="Send commercial proposal for Northwind pilot", assignee="Alex Rivera", is_completed=True),
            ActionItem(meeting_id=m2.id, text="Email VTT upload guide to Lena and Tom", assignee="Priya Nair", is_completed=False),
            ActionItem(meeting_id=m2.id, text="Schedule CS enablement session", assignee="Priya Nair", is_completed=False),
            ActionItem(meeting_id=m2.id, text="Prioritize account-level filter for next sprint", assignee="Alex Rivera", is_completed=False),
            ActionItem(meeting_id=m2.id, text="Confirm five AE pilot seats for Monday kickoff", assignee="Lena Vogt", is_completed=False),
        ]

        # ========== 3. 1:1 ==========
        m3 = Meeting(
            title="1:1 — Maya Chen & Sam Okonkwo",
            date=now - timedelta(days=2, hours=1),
            duration_minutes=28,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2),
        )
        m3.participants = _dedupe([people["maya"], people["sam"]])
        m3.tags = _dedupe([tags["1:1"], tags["engineering"]])
        db.add(m3)
        db.flush()

        s3 = {
            "Maya Chen": Speaker(meeting_id=m3.id, name="Maya Chen", color=SPEAKER_COLORS[0]),
            "Sam Okonkwo": Speaker(meeting_id=m3.id, name="Sam Okonkwo", color=SPEAKER_COLORS[2]),
        }
        for sp in s3.values():
            db.add(sp)
        db.flush()

        m3.transcript_lines = _lines(
            m3,
            s3,
            [
                ("Maya Chen", 0, 12, "Hey Sam — how are you feeling about the release pace this sprint?"),
                ("Sam Okonkwo", 12, 30, "Honestly a bit stretched. The parser flake ate two days, and I'm also on-call this week."),
                ("Maya Chen", 30, 48, "That's fair. Let's protect focus time. What can we drop or hand off?"),
                ("Sam Okonkwo", 48, 70, "The analytics dashboard polish can wait. I'd rather finish the VTT converter and stabilize CI."),
                ("Maya Chen", 70, 90, "Agreed. I'll move dashboard polish to next sprint and tell product. Anything else weighing on you?"),
                ("Sam Okonkwo", 90, 115, "I'd like more ownership of the ingest pipeline long-term — design docs, not just tickets."),
                ("Maya Chen", 115, 140, "I want that too. How about you draft an ingest architecture one-pager by Friday? I'll review with you Monday."),
                ("Sam Okonkwo", 140, 155, "That sounds great. I'll keep it practical — failure modes and retry semantics."),
                ("Maya Chen", 155, 175, "Perfect. On career growth — are you still interested in mentoring the intern next month?"),
                ("Sam Okonkwo", 175, 195, "Yes, as long as on-call weeks aren't stacked. Two hours a week feels right."),
                ("Maya Chen", 195, 215, "I'll schedule it that way. Also, your promotion packet — I need two peer notes. Jordan already agreed."),
                ("Sam Okonkwo", 215, 230, "I can ask Priya for the second. She's seen the search work."),
                ("Maya Chen", 230, 250, "Good. Feedback from me: your incident write-ups are excellent. Keep that visibility."),
                ("Sam Okonkwo", 250, 268, "Thanks. One ask — can we get a staging alert when CI flakes exceed three in a day?"),
                ("Maya Chen", 268, 290, "Yes. I'll file it with platform ops. Anything else before we wrap?"),
                ("Sam Okonkwo", 290, 310, "Just confirming PTO next Thursday for the visa appointment — half day."),
                ("Maya Chen", 310, 325, "Blocked on the calendar. Jordan covers on-call that afternoon."),
                ("Sam Okonkwo", 325, 340, "Appreciate it. This 1:1 helped a lot."),
                ("Maya Chen", 340, 355, "Glad to hear. Draft that one-pager and ping me if the flake comes back."),
                ("Sam Okonkwo", 355, 365, "Will do. Talk soon."),
                ("Maya Chen", 365, 372, "Take care."),
            ],
        )
        m3.summary = Summary(
            meeting_id=m3.id,
            overview_text=(
                "Maya and Sam discussed sprint load, with Sam stretched by CI flakiness and on-call. "
                "They agreed to defer analytics dashboard polish and focus Sam on the VTT converter and "
                "CI stability. Sam will draft an ingest architecture one-pager for career ownership, "
                "and Maya will coordinate mentoring and promotion peer notes. Operational follow-ups "
                "include a CI flake alert and half-day PTO coverage next Thursday."
            ),
            generated_at=now - timedelta(days=2),
        )
        m3.key_topics = [
            KeyTopic(meeting_id=m3.id, topic_text="Sprint load & focus protection", order_index=0),
            KeyTopic(meeting_id=m3.id, topic_text="Ingest pipeline ownership", order_index=1),
            KeyTopic(meeting_id=m3.id, topic_text="Mentoring & promotion packet", order_index=2),
            KeyTopic(meeting_id=m3.id, topic_text="CI flake alerting & PTO coverage", order_index=3),
        ]
        m3.action_items = [
            ActionItem(meeting_id=m3.id, text="Move analytics dashboard polish to next sprint", assignee="Maya Chen", is_completed=True),
            ActionItem(meeting_id=m3.id, text="Draft ingest architecture one-pager", assignee="Sam Okonkwo", is_completed=False),
            ActionItem(meeting_id=m3.id, text="Ask Priya for promotion peer note", assignee="Sam Okonkwo", is_completed=False),
            ActionItem(meeting_id=m3.id, text="File CI flake threshold alert with platform ops", assignee="Maya Chen", is_completed=False),
            ActionItem(meeting_id=m3.id, text="Confirm Jordan covers on-call Thursday afternoon", assignee="Maya Chen", is_completed=True),
        ]

        # ========== 4. Sprint planning ==========
        m4 = Meeting(
            title="Sprint 24 Planning — Meetings Experience",
            date=now - timedelta(days=5),
            duration_minutes=55,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=5),
        )
        m4.participants = _dedupe(
            [
                people["maya"],
                people["jordan"],
                people["sam"],
                people["priya"],
                people["nina"],
            ]
        )
        m4.tags = _dedupe([tags["planning"], tags["engineering"]])
        db.add(m4)
        db.flush()

        s4 = {
            "Maya Chen": Speaker(meeting_id=m4.id, name="Maya Chen", color=SPEAKER_COLORS[0]),
            "Jordan Blake": Speaker(meeting_id=m4.id, name="Jordan Blake", color=SPEAKER_COLORS[1]),
            "Sam Okonkwo": Speaker(meeting_id=m4.id, name="Sam Okonkwo", color=SPEAKER_COLORS[2]),
            "Priya Nair": Speaker(meeting_id=m4.id, name="Priya Nair", color=SPEAKER_COLORS[3]),
            "Nina Brooks": Speaker(meeting_id=m4.id, name="Nina Brooks", color=SPEAKER_COLORS[4]),
        }
        for sp in s4.values():
            db.add(sp)
        db.flush()

        m4.transcript_lines = _lines(
            m4,
            s4,
            [
                ("Nina Brooks", 0, 18, "Goal for Sprint 24: ship a believable Fireflies-like detail page — transcript sync, summary panel, and CRUD for meetings."),
                ("Maya Chen", 18, 35, "Capacity-wise we have about 28 eng points after on-call and the Northwind pilot support."),
                ("Jordan Blake", 35, 55, "I'd put 8 points on media seek sync and in-transcript search. The player stub can use a sample MP3."),
                ("Priya Nair", 55, 75, "UI for library + detail is 10 points if we reuse the design tokens. Modals for create/edit meeting included."),
                ("Sam Okonkwo", 75, 95, "API and schema are mostly ready. Seed data, upload endpoint, and action-item PATCH — call it 6 points."),
                ("Nina Brooks", 95, 115, "Must-haves from the assignment: library search/filter/sort, interactive transcript, AI summary section, full CRUD."),
                ("Maya Chen", 115, 135, "Bonus only if must-haves are green: global search, tags, ask-the-meeting chat, dark mode."),
                ("Jordan Blake", 135, 155, "Risk: timestamp sync bugs on long transcripts. I'll add unit tests around seek mapping."),
                ("Priya Nair", 155, 175, "I'll match Fireflies layout — left nav, list, then split transcript/summary. Study their spacing tonight."),
                ("Sam Okonkwo", 175, 195, "Do we need real auth? Assignment says default logged-in user is fine."),
                ("Nina Brooks", 195, 210, "Correct — mock user in the navbar. Settings can be Coming Soon."),
                ("Maya Chen", 210, 230, "Definition of done: seeded DB, README with schema, deployed frontend and API, demo link."),
                ("Jordan Blake", 230, 250, "I'll own player + transcript sync. Sam owns upload and seed. Priya owns library and detail chrome."),
                ("Priya Nair", 250, 270, "Can product write the six sample meeting narratives so seed text isn't lorem?"),
                ("Nina Brooks", 270, 290, "Yes — I'll draft themes today: standups, client, 1:1, planning, sales, design critique."),
                ("Sam Okonkwo", 290, 310, "I'll structure seed.py to accept those narratives as structured dicts."),
                ("Maya Chen", 310, 330, "Any dependencies on design?"),
                ("Priya Nair", 330, 350, "Need final orange accent and sidebar width. I'll lock tokens in Figma by tomorrow morning."),
                ("Jordan Blake", 350, 370, "Also need a royalty-free sample audio under /public or backend static."),
                ("Nina Brooks", 370, 390, "I'll drop a link in the sprint channel. Questions on prioritization?"),
                ("Sam Okonkwo", 390, 405, "If upload slips, seed alone still demos the product — upload is still must-have though."),
                ("Maya Chen", 405, 425, "Upload stays in must-have. Cut dark mode first if we slip."),
                ("Nina Brooks", 425, 445, "Locked. I'll update Jira and send the sprint goal to #product. Thanks everyone."),
                ("Priya Nair", 445, 455, "Thanks Nina."),
                ("Jordan Blake", 455, 462, "Let's ship it."),
            ],
        )
        m4.summary = Summary(
            meeting_id=m4.id,
            overview_text=(
                "Sprint 24 planning focused on delivering a Fireflies-like meetings experience: library "
                "search/filter, interactive transcript with media seek sync, summary panel, and meeting "
                "CRUD. The team allocated roughly 28 engineering points across player sync, UI chrome, "
                "and API/seed/upload work. Bonus features such as dark mode are explicitly lower priority. "
                "Owners were assigned for player, upload/seed, and library/detail UI, with Nina providing "
                "sample meeting narratives for realistic seed content."
            ),
            generated_at=now - timedelta(days=5),
        )
        m4.key_topics = [
            KeyTopic(meeting_id=m4.id, topic_text="Sprint goal & must-have scope", order_index=0),
            KeyTopic(meeting_id=m4.id, topic_text="Capacity & point allocation", order_index=1),
            KeyTopic(meeting_id=m4.id, topic_text="Transcript sync & search risks", order_index=2),
            KeyTopic(meeting_id=m4.id, topic_text="Seed narratives & upload endpoint", order_index=3),
            KeyTopic(meeting_id=m4.id, topic_text="Design tokens & sample audio", order_index=4),
        ]
        m4.action_items = [
            ActionItem(meeting_id=m4.id, text="Draft six sample meeting narratives for seed", assignee="Nina Brooks", is_completed=True),
            ActionItem(meeting_id=m4.id, text="Implement media seek ↔ transcript sync", assignee="Jordan Blake", is_completed=False),
            ActionItem(meeting_id=m4.id, text="Build library + detail UI chrome", assignee="Priya Nair", is_completed=False),
            ActionItem(meeting_id=m4.id, text="Finish seed.py and transcript upload API", assignee="Sam Okonkwo", is_completed=False),
            ActionItem(meeting_id=m4.id, text="Lock design tokens in Figma", assignee="Priya Nair", is_completed=True),
            ActionItem(meeting_id=m4.id, text="Provide sample audio asset link", assignee="Nina Brooks", is_completed=False),
        ]

        # ========== 5. Sales discovery ==========
        brightly_contact = Participant(name="Diego Alvarez", email="diego.alvarez@brightly.health")
        db.add(brightly_contact)
        db.flush()

        m5 = Meeting(
            title="Discovery Call — Brightly Health",
            date=now - timedelta(days=4, hours=3),
            duration_minutes=35,
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=4),
        )
        m5.participants = _dedupe([people["alex"], people["chris"], brightly_contact])
        m5.tags = _dedupe([tags["sales"], tags["client"]])
        db.add(m5)
        db.flush()

        s5 = {
            "Chris Patel": Speaker(meeting_id=m5.id, name="Chris Patel", color=SPEAKER_COLORS[0]),
            "Alex Rivera": Speaker(meeting_id=m5.id, name="Alex Rivera", color=SPEAKER_COLORS[1]),
            "Diego Alvarez": Speaker(meeting_id=m5.id, name="Diego Alvarez", color=SPEAKER_COLORS[2]),
        }
        for sp in s5.values():
            db.add(sp)
        db.flush()

        m5.transcript_lines = _lines(
            m5,
            s5,
            [
                ("Chris Patel", 0, 14, "Diego, thanks for the time. We're curious how Brightly handles meeting notes across clinical ops today."),
                ("Diego Alvarez", 14, 35, "Mostly messy. Nurses dictate into EHR, managers paste Zoom chats into Notion, and action items get lost."),
                ("Alex Rivera", 35, 55, "That's a common pattern. Our product centralizes transcript, summary, and tasks without replacing your EHR."),
                ("Diego Alvarez", 55, 75, "HIPAA is non-negotiable. Can you run in our Azure tenant with BAA?"),
                ("Chris Patel", 75, 95, "Yes — enterprise deploy supports customer-managed cloud and we sign a BAA. Alex can speak to architecture."),
                ("Alex Rivera", 95, 120, "Transcripts encrypt at rest. We don't train models on customer data. Audio can stay in your blob storage."),
                ("Diego Alvarez", 120, 145, "Good. We'd start with care-coordination huddles — fifteen minutes, three to six people, twice daily."),
                ("Chris Patel", 145, 165, "Perfect fit for our library and summary views. Do you need EHR write-back for tasks?"),
                ("Diego Alvarez", 165, 185, "Phase one: no. Export to CSV into our tasking tool is enough. Phase two maybe Epic."),
                ("Alex Rivera", 185, 205, "We can scope CSV and webhook events in phase one. Epic would be a later integration project."),
                ("Diego Alvarez", 205, 225, "Pricing — we have about 40 care managers. What's ballpark for annual?"),
                ("Chris Patel", 225, 250, "For 40 seats on enterprise, typically mid five-figures annually depending on SSO and retention. I'll send a range."),
                ("Diego Alvarez", 250, 270, "Also need admin audit logs. Our compliance team will ask in security review."),
                ("Alex Rivera", 270, 290, "Audit logs are on the enterprise checklist. I can share the security one-pager today."),
                ("Chris Patel", 290, 310, "Next step: 45-minute technical deep dive with your IT, then a two-week pilot on huddles."),
                ("Diego Alvarez", 310, 330, "I can do next Wednesday 11am PT for the deep dive. Pilot after our board week — so early August."),
                ("Chris Patel", 330, 350, "I'll send a calendar hold and the security pack. Anything else blocking evaluation?"),
                ("Diego Alvarez", 350, 370, "Just confirm data residency options — US-only is required."),
                ("Alex Rivera", 370, 390, "US-only regions are supported. We'll state that in the BAA exhibit."),
                ("Diego Alvarez", 390, 405, "Great conversation. Looking forward to the deep dive."),
                ("Chris Patel", 405, 420, "Likewise — thanks Diego. We'll follow up within a day."),
                ("Alex Rivera", 420, 430, "Talk soon."),
                ("Diego Alvarez", 430, 438, "Bye."),
            ],
        )
        m5.summary = Summary(
            meeting_id=m5.id,
            overview_text=(
                "Chris and Alex ran a discovery call with Diego Alvarez at Brightly Health about replacing "
                "fragmented Notion/EHR note-taking for care-coordination huddles. Diego required HIPAA, "
                "customer-managed Azure, a BAA, US-only residency, and audit logs. Phase one would use CSV "
                "export rather than EHR write-back. Next steps are a technical deep dive next Wednesday "
                "and a two-week pilot targeted for early August, with Chris sending pricing ranges and "
                "Alex sharing the security one-pager."
            ),
            generated_at=now - timedelta(days=4),
        )
        m5.key_topics = [
            KeyTopic(meeting_id=m5.id, topic_text="Current note-taking pain points", order_index=0),
            KeyTopic(meeting_id=m5.id, topic_text="HIPAA, BAA & Azure tenancy", order_index=1),
            KeyTopic(meeting_id=m5.id, topic_text="Care-coordination huddle use case", order_index=2),
            KeyTopic(meeting_id=m5.id, topic_text="Pricing for ~40 seats", order_index=3),
            KeyTopic(meeting_id=m5.id, topic_text="Deep dive & August pilot plan", order_index=4),
        ]
        m5.action_items = [
            ActionItem(meeting_id=m5.id, text="Send enterprise pricing range for 40 seats", assignee="Chris Patel", is_completed=False),
            ActionItem(meeting_id=m5.id, text="Share security one-pager and audit-log details", assignee="Alex Rivera", is_completed=True),
            ActionItem(meeting_id=m5.id, text="Send calendar hold for Wed 11am PT deep dive", assignee="Chris Patel", is_completed=False),
            ActionItem(meeting_id=m5.id, text="Confirm US-only residency language for BAA exhibit", assignee="Alex Rivera", is_completed=False),
        ]

        # ========== 6. Design critique ==========
        m6 = Meeting(
            title="Design Critique — Transcript Detail Layout",
            date=now - timedelta(hours=6),
            duration_minutes=40,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=5),
        )
        m6.participants = _dedupe(
            [people["priya"], people["nina"], people["jordan"], people["maya"]]
        )
        m6.tags = _dedupe([tags["design"]])
        db.add(m6)
        db.flush()

        s6 = {
            "Priya Nair": Speaker(meeting_id=m6.id, name="Priya Nair", color=SPEAKER_COLORS[3]),
            "Nina Brooks": Speaker(meeting_id=m6.id, name="Nina Brooks", color=SPEAKER_COLORS[4]),
            "Jordan Blake": Speaker(meeting_id=m6.id, name="Jordan Blake", color=SPEAKER_COLORS[1]),
            "Maya Chen": Speaker(meeting_id=m6.id, name="Maya Chen", color=SPEAKER_COLORS[0]),
        }
        for sp in s6.values():
            db.add(sp)
        db.flush()

        m6.transcript_lines = _lines(
            m6,
            s6,
            [
                ("Priya Nair", 0, 16, "Thanks for joining the critique. Goal: decide layout for transcript vs summary before I build."),
                ("Nina Brooks", 16, 35, "Fireflies puts transcript dominant on the left and AI tabs on the right. We should mirror that familiarity."),
                ("Jordan Blake", 35, 55, "From an eng view, sticky player at the top helps seek sync. Don't bury the scrubber in a side panel."),
                ("Maya Chen", 55, 75, "Agree. Also keep speaker colors consistent between list avatars and transcript labels."),
                ("Priya Nair", 75, 95, "Option A: 60/40 split. Option B: tabs that swap transcript and summary on smaller screens."),
                ("Nina Brooks", 95, 115, "Do both — 60/40 on desktop, tabs under 1024px. Assignment graders will resize."),
                ("Jordan Blake", 115, 135, "Search-in-transcript should highlight matches and jump on Enter. I'll expose a callback from the player hook."),
                ("Priya Nair", 135, 155, "For action items, checkboxes inline with assignee chips. Completed ones mute but stay visible."),
                ("Maya Chen", 155, 175, "Empty states matter — new meeting with no summary should show a generate placeholder, not a blank card."),
                ("Nina Brooks", 175, 195, "Copy: 'Summary will appear here once generated.' Avoid generic 'No data'."),
                ("Priya Nair", 195, 215, "Navbar: logo, Meetings, Upload, and a fake profile menu. Settings route can be Coming Soon."),
                ("Jordan Blake", 215, 235, "One concern — long transcripts of 400 lines. Virtualize the list or we'll jank on scroll."),
                ("Priya Nair", 235, 255, "I'll virtualize if we exceed 100 lines; seed data is under 40 so we can ship without it first."),
                ("Maya Chen", 255, 275, "Fine for the assignment. Leave a TODO. Typography — not Inter. Something a bit warmer."),
                ("Nina Brooks", 275, 295, "Try Source Sans for UI and a slightly tighter mono for timestamps."),
                ("Priya Nair", 295, 315, "Accent orange close to Fireflies without cloning their logo. Dark text on light gray canvas."),
                ("Jordan Blake", 315, 335, "Player keyboard shortcuts: space play/pause, j/l skip 5 seconds — nice polish if time."),
                ("Nina Brooks", 335, 355, "Only after sync works. Don't gold-plate."),
                ("Maya Chen", 355, 375, "Decision time: ship Option A with responsive tabs, sticky player, orange accent, muted completed tasks."),
                ("Priya Nair", 375, 395, "Locked. I'll update Figma tonight and start the detail page tomorrow morning."),
                ("Jordan Blake", 395, 410, "I'll stub the player component API so Priya can wire clicks."),
                ("Nina Brooks", 410, 425, "I'll review the Figma async by EOD. Great session."),
                ("Priya Nair", 425, 438, "Thanks all — critique adjourned."),
                ("Maya Chen", 438, 445, "Thanks Priya."),
            ],
        )
        m6.summary = Summary(
            meeting_id=m6.id,
            overview_text=(
                "The team critiqued the transcript detail layout and aligned on a Fireflies-like 60/40 "
                "split with responsive tabs on smaller screens. Engineering asked for a sticky top player "
                "to support seek sync and optional virtualization for long transcripts later. Product "
                "emphasized familiar patterns, clear empty-state copy, and deprioritizing keyboard polish "
                "until sync is solid. Priya will update Figma and begin implementation; Jordan will stub "
                "the player component API."
            ),
            generated_at=now - timedelta(hours=5),
        )
        m6.key_topics = [
            KeyTopic(meeting_id=m6.id, topic_text="60/40 layout vs responsive tabs", order_index=0),
            KeyTopic(meeting_id=m6.id, topic_text="Sticky media player & seek sync", order_index=1),
            KeyTopic(meeting_id=m6.id, topic_text="Action items & empty states", order_index=2),
            KeyTopic(meeting_id=m6.id, topic_text="Typography, accent, and navbar chrome", order_index=3),
        ]
        m6.action_items = [
            ActionItem(meeting_id=m6.id, text="Update Figma for 60/40 + responsive tabs", assignee="Priya Nair", is_completed=False),
            ActionItem(meeting_id=m6.id, text="Stub player component API for transcript clicks", assignee="Jordan Blake", is_completed=False),
            ActionItem(meeting_id=m6.id, text="Async review Figma by EOD", assignee="Nina Brooks", is_completed=False),
            ActionItem(meeting_id=m6.id, text="Add TODO for transcript list virtualization", assignee="Priya Nair", is_completed=True),
            ActionItem(meeting_id=m6.id, text="Finalize orange accent tokens in theme", assignee="Priya Nair", is_completed=False),
        ]

        db.commit()

        count = db.query(Meeting).count()
        lines = db.query(TranscriptLine).count()
        actions = db.query(ActionItem).count()
        print(f"Seeded {count} meetings, {lines} transcript lines, {actions} action items")
        print(f"Database: {DATABASE_URL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
