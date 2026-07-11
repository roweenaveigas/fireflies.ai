# Meeting Notes & Transcription Platform (Fireflies.ai Clone)

A full-stack Fireflies.ai-style meeting notes and transcription web app, built as an SDE fullstack assignment. The product focuses on **post-meeting workflows**—browsing a meetings library, reviewing interactive transcripts synced to a media player, and managing AI-style summaries, key topics, and action items—rather than real-time speech-to-text.

**Live repo:** [github.com/roweenaveigas/fireflies.ai](https://github.com/roweenaveigas/fireflies.ai)

---

## Tech Stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, axios, Zustand, lucide-react |
| **Backend** | Python FastAPI, SQLAlchemy 2.x, Pydantic v2, Uvicorn |
| **Database** | SQLite (`backend/data/meetings.db`) |
| **Tooling** | npm, pip / venv; optional helper scripts under `scripts/` |

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API base: [http://localhost:8000](http://localhost:8000)
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: `GET /health`

Tables are created automatically on app startup (`Base.metadata.create_all`). You can also create them explicitly:

```bash
cd backend
python -m app.init_db
```

### 2. Seed the database

From the `backend/` directory (with the venv activated):

```bash
python -m app.seed
```

This loads **6 realistic sample meetings** (participants, speakers, transcript lines, summaries, key topics, action items, tags). The seed is **idempotent**: it clears existing rows first, so it is safe to re-run.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)

Optional env (defaults to `http://localhost:8000` if unset):

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Copy from `frontend/.env.local.example` if needed.

### One-command helpers (from repo root)

```bash
# Windows PowerShell
.\scripts\dev-backend.ps1
.\scripts\dev-frontend.ps1

# macOS / Linux
./scripts/dev-backend.sh
./scripts/dev-frontend.sh
```

Run backend and frontend in **two separate terminals**.

---

## Architecture Overview

### Folder structure

```
fireflies.ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, /health, mounts /api
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── init_db.py           # Create tables
│   │   ├── seed.py              # Sample data
│   │   ├── db/
│   │   │   └── session.py       # Engine, SessionLocal, get_db
│   │   ├── routers/
│   │   │   ├── meetings.py      # Meeting CRUD + list filters
│   │   │   ├── action_items.py  # Nested action-item CRUD
│   │   │   └── search.py        # Global title/transcript search
│   │   └── services/
│   │       └── meetings.py      # Serialization, transcript parse helpers
│   ├── data/
│   │   └── meetings.db          # SQLite DB (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── public/audio/            # Sample meeting audio for the player
│   └── src/
│       ├── app/(app)/           # App Router pages (home, meetings, detail, placeholders)
│       ├── components/          # UI: layout, meetings, brand, modals
│       ├── lib/
│       │   ├── api.ts           # Axios client (base URL)
│       │   ├── meetings.ts      # Typed API helpers
│       │   └── types.ts         # Shared TS types
│       └── store/               # Zustand (UI state)
├── scripts/                     # Local dev helpers
└── README.md
```

### How the frontend talks to the backend

1. **Axios client** (`frontend/src/lib/api.ts`) points at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
2. **Typed helpers** (`frontend/src/lib/meetings.ts`) call REST paths under `/api/...` (e.g. `GET /api/meetings`, `PUT /api/meetings/:id`).
3. **CORS** on the FastAPI app allows `http://localhost:3000` and `http://127.0.0.1:3000`.
4. React pages/components fetch on mount or after user actions (create/edit/delete meeting, toggle action items). There is **no auth header**—requests are unauthenticated.
5. Meeting detail syncs the media player seek position with `transcript_lines.start_time_seconds`. New meetings can include pasted transcript text (parsed on the backend) or structured lines; summaries/topics may be supplied in the create payload (mocked “AI,” not generated live).

```
Browser (Next.js :3000)
    │  axios HTTP JSON
    ▼
FastAPI (:8000)  →  /api/* routers  →  SQLAlchemy  →  SQLite
```

### Main UI routes

| Route | Purpose |
|-------|---------|
| `/` | Home dashboard (Quick Start / Recent style) |
| `/meetings` | Meetings library (search, date filter, sort) |
| `/meetings/[id]` | Detail: player, transcript, summary, action items |
| `/live`, `/integrations`, `/team`, `/settings` | Placeholder / Coming Soon pages |

---

## Database Schema

SQLite file: `backend/data/meetings.db`. Foreign keys are enabled via `PRAGMA foreign_keys=ON`.

### Entity relationship (summary)

```
participants ←──M:N──→ meetings ←──M:N──→ tags
                         │
         ┌───────────────┼───────────────┬──────────────┐
         ▼               ▼               ▼              ▼
      speakers    transcript_lines   summaries     key_topics
         ▲               │           (1:1)              │
         └───────────────┘                              │
                   action_items ◄───────────────────────┘
                   (N:1 meeting)
```

### Tables

| Table | Description |
|-------|-------------|
| **`meetings`** | Core meeting record: `title`, `date`, `duration_minutes`, `created_at`, `updated_at`. Parent of speakers, transcript lines, summary, topics, and action items. |
| **`participants`** | People who can attend meetings (`name`, optional unique `email`). Shared across meetings. |
| **`meeting_participants`** | Many-to-many join: `meeting_id` ↔ `participant_id` (CASCADE on delete). |
| **`speakers`** | Per-meeting speaker labels (`name`, UI `color`). Unique `(meeting_id, name)`. Owned by a meeting (CASCADE). |
| **`transcript_lines`** | Timestamped segments: `start_time_seconds`, `end_time_seconds`, `text`, `order_index`. Belongs to a meeting and a speaker (CASCADE). |
| **`summaries`** | One overview per meeting (`overview_text`, `generated_at`). Unique `meeting_id` (1:1). |
| **`key_topics`** | Ordered topic/chapter strings (`topic_text`, `order_index`) for a meeting. |
| **`action_items`** | Tasks: `text`, optional `assignee`, `is_completed`, `created_at`. Belong to a meeting. |
| **`tags`** | Global tag names (`name` unique). |
| **`meeting_tags`** | Many-to-many join: `meeting_id` ↔ `tag_id` (CASCADE on delete). |

### Relationships (quick reference)

| Relationship | Type | Notes |
|--------------|------|--------|
| Meeting ↔ Participant | M:N | Via `meeting_participants` |
| Meeting ↔ Tag | M:N | Via `meeting_tags` |
| Meeting → Speaker | 1:N | Cascade delete-orphan |
| Meeting → TranscriptLine | 1:N | Ordered by `order_index` |
| Speaker → TranscriptLine | 1:N | Each line has one speaker |
| Meeting → Summary | 1:1 | Optional; unique FK on `summaries.meeting_id` |
| Meeting → KeyTopic | 1:N | Ordered topics |
| Meeting → ActionItem | 1:N | CRUD via nested API |

---

## API Endpoint Overview

All application routes are under the `/api` prefix (except `/health`).

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness check (`{"status":"ok"}`) |
| `GET` | `/api/meetings` | List meetings. Query: `q` (title/participant), `date_from`, `date_to`, `sort` (`recency` \| `oldest`) |
| `GET` | `/api/meetings/{id}` | Full meeting detail (participants, speakers, transcript, summary, topics, action items, tags) |
| `POST` | `/api/meetings` | Create meeting (optional participants, tags, transcript text/lines, summary, key topics, action items) |
| `PUT` | `/api/meetings/{id}` | Update meeting metadata (e.g. title, date, duration, participants by name) |
| `DELETE` | `/api/meetings/{id}` | Delete meeting and cascaded children |
| `POST` | `/api/meetings/{id}/action-items` | Create an action item on a meeting |
| `PUT` | `/api/meetings/{id}/action-items/{item_id}` | Update text, assignee, or completion |
| `DELETE` | `/api/meetings/{id}/action-items/{item_id}` | Delete an action item |
| `GET` | `/api/search?q=` | Search meeting titles and transcript text; returns snippets with match type |

Interactive OpenAPI docs: [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Assumptions

- **No real authentication** — there is a single implied default user; no login, JWT, or multi-tenant isolation.
- **Mocked transcription** — no live STT or ASR pipeline. Transcripts come from seed data, pasted/uploaded text parsed into lines, or structured JSON on create.
- **Mocked “AI” summaries** — summaries, key topics, and action items are stored/seeded or supplied by the client; they are not generated by an LLM at request time.
- **Single SQLite database** — fine for local demo; not production-hardened (no migrations required for the assignment beyond optional Alembic in deps).
- **Sample audio** — the media player uses a shared sample WAV (and/or a demo timer) rather than per-meeting recordings.
- **Live Bot / Integrations / Team / Settings** — UI placeholders only; not wired to real bots, OAuth, or calendar providers.
- **CORS limited to local frontend** — `localhost:3000` / `127.0.0.1:3000` for development.
- **Search API** — backend supports global `/api/search`; the meetings library primarily uses list filters (`q`, dates, sort) from the UI.

---

## License

Assignment / educational use.
