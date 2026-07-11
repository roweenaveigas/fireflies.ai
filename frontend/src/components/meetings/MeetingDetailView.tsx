"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Share2,
  Trash2,
} from "lucide-react";
import { ActionItemsPanel } from "@/components/meetings/ActionItemsPanel";
import { AskFredPanel } from "@/components/meetings/AskFredPanel";
import { CommentsDrawer } from "@/components/meetings/CommentsDrawer";
import { DeleteMeetingModal } from "@/components/meetings/DeleteMeetingModal";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { ExportMenu } from "@/components/meetings/ExportMenu";
import {
  MediaPlayer,
  type MediaPlayerHandle,
} from "@/components/meetings/MediaPlayer";
import { MeetingTagsEditor } from "@/components/meetings/MeetingTagsEditor";
import { SmartSearchPanel } from "@/components/meetings/SmartSearchPanel";
import { SummaryPanel } from "@/components/meetings/SummaryPanel";
import { TranscriptPanel } from "@/components/meetings/TranscriptPanel";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createComment,
  createHighlight,
  createSoundbite,
  deleteHighlight,
  deleteSoundbite,
} from "@/lib/annotations";
import { avatarColor, formatClock, getInitials } from "@/lib/format";
import { fetchMeeting } from "@/lib/meetings";
import type {
  ActionItem,
  Highlight,
  MeetingDetail,
  Soundbite,
  TranscriptComment,
} from "@/lib/types";

type RightTab = "transcript" | "askfred";

const SPEEDS = [0.5, 1, 1.25, 1.5, 1.75, 2] as const;

export function MeetingDetailView({ meetingId }: { meetingId: number }) {
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();
  const playerRef = useRef<MediaPlayerHandle | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [focusLineId, setFocusLineId] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("transcript");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<number>>(new Set());
  const [commentLineId, setCommentLineId] = useState<number | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [soundbiteLineId, setSoundbiteLineId] = useState<number | null>(null);
  const [soundbiteLabel, setSoundbiteLabel] = useState("");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCurrentTime(0);
    setActiveLineId(null);

    fetchMeeting(meetingId)
      .then((data) => {
        if (!cancelled) setMeeting(data);
      })
      .catch(() => {
        if (!cancelled) {
          setMeeting(null);
          setError("Meeting not found or API is unreachable.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  // Deep-link from global search: ?line=&t=
  useEffect(() => {
    if (!meeting) return;
    const lineParam = searchParams.get("line");
    const tParam = searchParams.get("t");
    if (lineParam) {
      const lineId = Number(lineParam);
      const line = meeting.transcript_lines.find((l) => l.id === lineId);
      if (line) {
        setFocusLineId(lineId);
        setActiveLineId(lineId);
        const t = tParam != null ? Number(tParam) : line.start_time_seconds;
        setCurrentTime(t);
        window.setTimeout(() => playerRef.current?.seekTo(t), 100);
      }
    } else if (tParam != null) {
      const t = Number(tParam);
      if (Number.isFinite(t)) {
        setCurrentTime(t);
        window.setTimeout(() => playerRef.current?.seekTo(t), 100);
      }
    }
  }, [meeting, searchParams]);

  const durationSeconds = useMemo(() => {
    if (!meeting?.transcript_lines.length) return 1;
    return meeting.transcript_lines.reduce((max, line) => {
      const end =
        Number.isFinite(line.end_time_seconds) && line.end_time_seconds > 0
          ? line.end_time_seconds
          : line.start_time_seconds;
      const start = Number.isFinite(line.start_time_seconds)
        ? line.start_time_seconds
        : 0;
      return Math.max(max, end, start);
    }, 0);
  }, [meeting]);

  const highlights = useMemo(
    () => meeting?.highlights ?? [],
    [meeting?.highlights]
  );
  const comments = useMemo(
    () => meeting?.comments ?? [],
    [meeting?.comments]
  );
  const soundbites = useMemo(
    () => meeting?.soundbites ?? [],
    [meeting?.soundbites]
  );

  const highlightedLineIds = useMemo(
    () => new Set(highlights.map((h) => h.transcript_line_id)),
    [highlights]
  );

  const commentCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of comments) {
      map.set(c.transcript_line_id, (map.get(c.transcript_line_id) ?? 0) + 1);
    }
    return map;
  }, [comments]);

  const onSeek = (seconds: number, lineId: number) => {
    const start = Number(seconds);
    if (!Number.isFinite(start)) return;
    setActiveLineId(lineId);
    setCurrentTime(start);
    playerRef.current?.seekTo(start);
  };

  const setActionItems = (items: ActionItem[]) => {
    setMeeting((prev) => (prev ? { ...prev, action_items: items } : prev));
  };

  const setHighlights = (next: Highlight[]) => {
    setMeeting((prev) => (prev ? { ...prev, highlights: next } : prev));
  };

  const setComments = (next: TranscriptComment[]) => {
    setMeeting((prev) => (prev ? { ...prev, comments: next } : prev));
  };

  const setSoundbites = (next: Soundbite[]) => {
    setMeeting((prev) => (prev ? { ...prev, soundbites: next } : prev));
  };

  const toggleSelect = (lineId: number) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const toggleHighlight = async (lineId: number) => {
    if (!meeting) return;
    const existing = highlights.find((h) => h.transcript_line_id === lineId);
    try {
      if (existing) {
        await deleteHighlight(meeting.id, existing.id);
        setHighlights(highlights.filter((h) => h.id !== existing.id));
        success("Highlight removed.");
      } else {
        const created = await createHighlight(meeting.id, lineId);
        setHighlights([...highlights, created]);
        success("Line highlighted.");
      }
    } catch {
      toastError("Could not update highlight.");
    }
  };

  const submitComment = async () => {
    if (!meeting || commentLineId == null || !commentBody.trim()) return;
    try {
      const created = await createComment(meeting.id, {
        transcript_line_id: commentLineId,
        body: commentBody.trim(),
      });
      setComments([...comments, created]);
      setCommentBody("");
      setCommentLineId(null);
      setCommentsOpen(true);
      success("Comment added.");
    } catch {
      toastError("Could not add comment.");
    }
  };

  const submitSoundbite = async () => {
    if (!meeting || soundbiteLineId == null || !soundbiteLabel.trim()) return;
    try {
      const created = await createSoundbite(meeting.id, {
        transcript_line_id: soundbiteLineId,
        label: soundbiteLabel.trim(),
      });
      setSoundbites([...soundbites, created]);
      setSoundbiteLabel("");
      setSoundbiteLineId(null);
      success("Soundbite saved.");
    } catch {
      toastError("Could not save soundbite.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[100vh] flex-col bg-white">
        <div className="flex h-12 items-center gap-3 border-b border-[var(--ff-border-soft)] px-3">
          <div className="ff-skeleton h-5 w-5 rounded" />
          <div className="ff-skeleton h-4 w-48" />
          <div className="ml-auto flex gap-2">
            <div className="ff-skeleton h-8 w-20 rounded-lg" />
            <div className="ff-skeleton h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="ff-skeleton hidden h-full w-14 lg:block" />
          <div className="min-w-0 flex-1 space-y-3 p-4">
            <div className="ff-skeleton aspect-video w-full rounded-lg" />
            <div className="ff-skeleton h-40 w-full rounded-xl" />
          </div>
          <div className="ff-skeleton hidden h-full w-[42%] lg:block" />
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex h-[100vh] flex-col items-center justify-center bg-white px-6">
        <p className="text-sm font-medium text-red-500">
          {error ?? "Meeting not found."}
        </p>
        <Link
          href="/meetings"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6C5CE7] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to meetings
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, (currentTime / Math.max(durationSeconds, 1)) * 100);

  return (
    <div className="flex h-[100vh] flex-col bg-white">
      {/* Top header bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--ff-border-soft)] px-2 sm:px-3">
        <Link
          href="/meetings"
          className="rounded-md p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
          aria-label="Back to meetings"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-ff-gray-2">
          <Link href="/meetings" className="shrink-0 transition hover:text-[#6C5CE7]">
            #All Meetings
          </Link>
          <span className="shrink-0">/</span>
          <span className="truncate font-medium text-ff-text">{meeting.title}</span>
        </div>

        <button
          type="button"
          className="rounded-md p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        <div className="hidden items-center sm:flex">
          <div className="flex items-center -space-x-1.5">
            {meeting.participants.slice(0, 5).map((p) => (
              <span
                key={p.id}
                title={p.name}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white"
                style={{ backgroundColor: avatarColor(p.name) }}
              >
                {getInitials(p.name)}
              </span>
            ))}
          </div>
          <span className="ml-2 text-[11px] text-ff-gray">
            {meeting.participants.length} Views
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#6C5CE7] px-3 text-[12px] font-semibold text-white transition hover:bg-[#5B4CDB]"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>

        <button
          type="button"
          className="rounded-md border border-ff-border p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>

        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-bold text-white">
          Y
        </span>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="rounded-md p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-md p-1.5 text-ff-gray transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: Smart Search */}
        <div className="hidden shrink-0 border-r border-[var(--ff-border-soft)] lg:block">
          <SmartSearchPanel
            meeting={meeting}
            onOpenComments={() => setCommentsOpen(true)}
            highlightCount={highlights.length}
            commentCount={comments.length}
            soundbiteCount={soundbites.length}
          />
        </div>

        {/* Center: Player + Action items */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
          <MediaPlayer
            ref={playerRef}
            chrome="video"
            playbackRate={speed}
            onPlaybackRateChange={setSpeed}
            onPlayingChange={setPlaying}
            durationSeconds={durationSeconds}
            currentTime={currentTime}
            onTimeUpdate={(t) => {
              setCurrentTime(t);
              setActiveLineId((prev) => {
                if (prev == null || !meeting) return null;
                const line = meeting.transcript_lines.find((l) => l.id === prev);
                if (!line) return null;
                const inRange =
                  t >= line.start_time_seconds &&
                  t < line.end_time_seconds + 0.35;
                return inRange ? prev : null;
              });
            }}
          />

          <div className="mt-4">
            <MeetingTagsEditor meeting={meeting} onSaved={setMeeting} />
          </div>

          {soundbites.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--ff-border-soft)] p-2.5">
              <Bookmark className="h-4 w-4 text-[#6C5CE7]" />
              <span className="text-xs font-semibold text-ff-text">Soundbites</span>
              {soundbites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSeek(s.start_time_seconds, s.transcript_line_id)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ff-soft px-2.5 py-1 text-[11px] font-medium text-[#6C5CE7] transition hover:bg-ff-muted"
                >
                  {s.label}
                  <span className="text-ff-gray-2">
                    {formatClock(s.start_time_seconds)}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-white/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteSoundbite(meeting.id, s.id)
                        .then(() => {
                          setSoundbites(soundbites.filter((x) => x.id !== s.id));
                          success("Soundbite deleted.");
                        })
                        .catch(() => toastError("Could not delete soundbite."));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.click();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border-2 border-dashed border-[#6C5CE7]/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ff-text">Action items</h3>
            <ActionItemsPanel
              meetingId={meeting.id}
              items={meeting.action_items}
              onChange={setActionItems}
              compact
              onTimestampClick={(seconds) => {
                playerRef.current?.seekTo(seconds);
                setCurrentTime(seconds);
              }}
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSummaryOpen((v) => !v)}
              className="text-sm font-semibold text-ff-text transition hover:text-[#6C5CE7]"
            >
              Summary {summaryOpen ? "▾" : "▸"}
            </button>
            {summaryOpen ? (
              <div className="mt-2">
                <SummaryPanel
                  summary={meeting.summary}
                  keyTopics={meeting.key_topics}
                />
              </div>
            ) : null}
          </div>

          {/* Mobile shortcuts */}
          <div className="mt-4 flex gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="ff-btn-secondary flex-1"
            >
              Comments ({comments.length})
            </button>
            <button
              type="button"
              onClick={() => setRightTab("askfred")}
              className="ff-btn-secondary flex-1"
            >
              AskFred
            </button>
          </div>
        </div>

        {/* Right: Transcript | AskFred */}
        <aside className="flex w-full min-h-0 min-w-0 flex-col border-l border-[var(--ff-border-soft)] lg:w-[42%]">
          <div className="flex shrink-0 gap-0.5 border-b border-[var(--ff-border-soft)] px-2">
            <button
              type="button"
              onClick={() => setRightTab("transcript")}
              className={`ff-tab ${rightTab === "transcript" ? "ff-tab-active" : ""}`}
            >
              Transcript
            </button>
            <button
              type="button"
              onClick={() => setRightTab("askfred")}
              className={`ff-tab inline-flex items-center gap-1.5 ${
                rightTab === "askfred" ? "ff-tab-active" : ""
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-ff-soft text-[9px] font-bold text-[#6C5CE7]">
                AI
              </span>
              AskFred
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {rightTab === "transcript" ? (
              <TranscriptPanel
                embedded
                lines={meeting.transcript_lines}
                currentTime={currentTime}
                activeLineId={activeLineId}
                onSeek={onSeek}
                highlightedLineIds={highlightedLineIds}
                focusLineId={focusLineId}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <AskFredPanel />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom sticky playback bar — controls centered like Fireflies */}
      <div className="flex h-14 shrink-0 items-center justify-center border-t border-[var(--ff-border-soft)] bg-white px-3">
        <div className="flex max-w-3xl items-center gap-2 sm:gap-3">
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-ff-gray">
            {formatClock(currentTime)} / {formatClock(durationSeconds)}
          </span>

          <input
            type="range"
            min={0}
            max={Math.max(durationSeconds, 1)}
            step={0.1}
            value={Math.min(currentTime, durationSeconds)}
            onChange={(e) => {
              const t = Number(e.target.value);
              playerRef.current?.seekTo(t);
              setCurrentTime(t);
            }}
            className="seek-range h-1 w-40 cursor-pointer sm:w-56 md:w-72"
            style={{
              background: `linear-gradient(to right, #6C5CE7 ${progress}%, #E5E7EB ${progress}%)`,
            }}
            aria-label="Seek"
          />

          <button
            type="button"
            onClick={() => playerRef.current?.skipBy(-10)}
            className="rounded-lg p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
            aria-label="Back 10 seconds"
            title="−10s"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => playerRef.current?.toggle()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C5CE7] text-white shadow-sm shadow-[#6C5CE7]/30 transition hover:bg-[#5B4CDB]"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current pl-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => playerRef.current?.skipBy(10)}
            className="rounded-lg p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
            aria-label="Forward 10 seconds"
            title="+10s"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-md border border-ff-border bg-white px-1.5 py-1 text-[11px] font-semibold text-ff-text outline-none focus:border-[#6C5CE7]"
            aria-label="Playback speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>

          <ExportMenu meeting={meeting} compact />
        </div>
      </div>

      <CommentsDrawer
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        meeting={meeting}
        comments={comments}
        onChange={setComments}
        onJumpToLine={(lineId) => {
          const line = meeting.transcript_lines.find((l) => l.id === lineId);
          if (line) {
            setFocusLineId(lineId);
            onSeek(line.start_time_seconds, lineId);
            setCommentsOpen(false);
            setRightTab("transcript");
          }
        }}
      />

      <Modal
        open={commentLineId != null}
        onClose={() => setCommentLineId(null)}
        title="Add comment"
        description="Attach a note to this transcript segment."
      >
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          className="ff-input min-h-[100px]"
          placeholder="Write your comment…"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="ff-btn-secondary"
            onClick={() => setCommentLineId(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ff-btn-primary"
            disabled={!commentBody.trim()}
            onClick={() => void submitComment()}
          >
            Save comment
          </button>
        </div>
      </Modal>

      <Modal
        open={soundbiteLineId != null}
        onClose={() => setSoundbiteLineId(null)}
        title="Save soundbite"
        description="Label this clip for quick replay."
      >
        <input
          value={soundbiteLabel}
          onChange={(e) => setSoundbiteLabel(e.target.value)}
          className="ff-input"
          placeholder="Soundbite label"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="ff-btn-secondary"
            onClick={() => setSoundbiteLineId(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ff-btn-primary"
            disabled={!soundbiteLabel.trim()}
            onClick={() => void submitSoundbite()}
          >
            Save soundbite
          </button>
        </div>
      </Modal>

      <EditMeetingModal
        open={editOpen}
        meeting={meeting}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => setMeeting(updated)}
      />
      <DeleteMeetingModal
        open={deleteOpen}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
