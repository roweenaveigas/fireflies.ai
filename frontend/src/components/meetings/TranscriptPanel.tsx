"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import type { TranscriptLine } from "@/lib/types";
import { avatarColor, formatClock, getInitials } from "@/lib/format";

type TranscriptPanelProps = {
  lines: TranscriptLine[];
  currentTime: number;
  activeLineId: number | null;
  onSeek: (seconds: number, lineId: number) => void;
  highlightedLineIds?: Set<number>;
  commentCounts?: Map<number, number>;
  selectedLineIds?: Set<number>;
  onToggleSelect?: (lineId: number) => void;
  onHighlight?: (lineId: number) => void;
  onComment?: (lineId: number) => void;
  onSoundbite?: (lineId: number) => void;
  focusLineId?: number | null;
  embedded?: boolean;
};

type MatchHit = { lineId: number; index: number };

function highlightText(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(re);
  const q = query.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === q ? (
      <mark
        key={`${i}-${part}`}
        className="rounded bg-brand/20 px-0.5 text-brand-dark"
      >
        {part}
      </mark>
    ) : (
      <span key={`${i}-${part}`}>{part}</span>
    )
  );
}

export function TranscriptPanel({
  lines,
  currentTime,
  activeLineId,
  onSeek,
  highlightedLineIds,
  focusLineId,
  embedded = false,
}: TranscriptPanelProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const userScrolledRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  const matches = useMemo(() => {
    if (!debounced) return [] as MatchHit[];
    const q = debounced.toLowerCase();
    const hits: MatchHit[] = [];
    lines.forEach((line) => {
      const lower = line.text.toLowerCase();
      let from = 0;
      let idx = lower.indexOf(q, from);
      let n = 0;
      while (idx !== -1) {
        hits.push({ lineId: line.id, index: n });
        n += 1;
        from = idx + q.length;
        idx = lower.indexOf(q, from);
      }
    });
    return hits;
  }, [lines, debounced]);

  useEffect(() => {
    setMatchIndex(0);
  }, [debounced]);

  const activeFromTime = useMemo(() => {
    if (!lines.length) return null;
    let current: TranscriptLine | null = null;
    for (const line of lines) {
      if (currentTime >= line.start_time_seconds) {
        current = line;
      } else {
        break;
      }
    }
    return current?.id ?? lines[0]?.id ?? null;
  }, [lines, currentTime]);

  const playheadId = activeLineId ?? activeFromTime;

  useEffect(() => {
    if (userScrolledRef.current) return;
    const target = focusLineId ?? playheadId;
    if (target == null) return;
    const el = lineRefs.current.get(target);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [playheadId, focusLineId]);

  const jumpToMatch = (nextIndex: number) => {
    if (!matches.length) return;
    const idx = ((nextIndex % matches.length) + matches.length) % matches.length;
    setMatchIndex(idx);
    const hit = matches[idx];
    const line = lines.find((l) => l.id === hit.lineId);
    if (!line) return;
    userScrolledRef.current = false;
    onSeek(line.start_time_seconds, line.id);
    requestAnimationFrame(() => {
      lineRefs.current.get(line.id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 flex-1 flex-col"
          : "ff-card flex min-h-0 flex-1 flex-col"
      }
    >
      <div className="flex flex-col gap-3 border-b border-[var(--ff-border-soft)] p-4 sm:flex-row sm:items-center">
        {embedded ? null : (
          <h2 className="text-sm font-semibold text-ff-text">Transcript</h2>
        )}
        <div className="flex flex-1 items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ff-gray-2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find or Replace"
              className="w-full rounded-lg border border-ff-border bg-[var(--ff-input-bg)] py-2 pl-9 pr-3 text-sm text-ff-text outline-none focus:border-ff-purple focus:ring-2 focus:ring-ff-purple/15"
            />
          </label>
          {debounced ? (
            <div className="flex items-center gap-1">
              <span className="whitespace-nowrap text-xs text-ff-gray">
                {matches.length
                  ? `${Math.min(matchIndex + 1, matches.length)}/${matches.length}`
                  : "0"}
              </span>
              <button
                type="button"
                disabled={!matches.length}
                onClick={() => jumpToMatch(matchIndex - 1)}
                className="rounded-md border border-ff-border p-1.5 text-ff-gray hover:bg-[var(--ff-row-hover)] disabled:opacity-40"
                aria-label="Previous match"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!matches.length}
                onClick={() => jumpToMatch(matchIndex + 1)}
                className="rounded-md border border-ff-border p-1.5 text-ff-gray hover:bg-[var(--ff-row-hover)] disabled:opacity-40"
                aria-label="Next match"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={
          embedded
            ? "max-h-none flex-1 space-y-1 overflow-y-auto p-2 sm:p-3"
            : "max-h-[min(60vh,640px)] flex-1 space-y-1 overflow-y-auto p-2 sm:p-3"
        }
        onScroll={() => {
          userScrolledRef.current = true;
          window.setTimeout(() => {
            userScrolledRef.current = false;
          }, 2500);
        }}
      >
        {lines.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-ff-gray">
            No transcript lines for this meeting.
          </p>
        ) : (
          lines.map((line) => {
            const speakerName = line.speaker?.name ?? "Speaker";
            const color = line.speaker?.color || avatarColor(speakerName);
            const active = line.id === playheadId;
            const isMatchLine =
              !!debounced &&
              line.text.toLowerCase().includes(debounced.toLowerCase());
            const isSavedHighlight = highlightedLineIds?.has(line.id);

            return (
              <div
                key={line.id}
                ref={(el) => {
                  if (el) lineRefs.current.set(line.id, el);
                  else lineRefs.current.delete(line.id);
                }}
                className={`group flex w-full gap-2 rounded-xl px-2 py-2.5 transition sm:gap-3 sm:px-3 ${
                  active
                    ? "bg-[var(--ff-highlight)] ring-1 ring-ff-purple/20"
                    : isSavedHighlight
                      ? "bg-[var(--ff-amber)]"
                      : isMatchLine
                        ? "bg-[var(--ff-amber)]/80"
                        : "hover:bg-[var(--ff-row-hover)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    userScrolledRef.current = false;
                    onSeek(line.start_time_seconds, line.id);
                  }}
                  className="flex min-w-0 flex-1 gap-3 text-left"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(speakerName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-ff-text">
                        {speakerName} · {formatClock(line.start_time_seconds)}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 block text-sm leading-relaxed ${
                        isSavedHighlight
                          ? "font-semibold text-[#6C5CE7]"
                          : "text-ff-gray"
                      }`}
                    >
                      {highlightText(line.text, debounced)}
                    </span>
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
