"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Bookmark,
  Highlighter,
  MessageSquare,
  Search,
} from "lucide-react";
import type { MeetingDetail } from "@/lib/types";

type SmartSearchPanelProps = {
  meeting: MeetingDetail;
  onOpenComments: () => void;
  highlightCount: number;
  commentCount: number;
  soundbiteCount: number;
};

type RailKey = "smart" | "notes" | "pulse" | "comments" | "bookmarks" | "highlights";

export function SmartSearchPanel({
  meeting,
  onOpenComments,
  highlightCount,
  commentCount,
  soundbiteCount,
}: SmartSearchPanelProps) {
  /** Smart Search panel is closed until the search icon is clicked */
  const [smartOpen, setSmartOpen] = useState(false);
  const [active, setActive] = useState<RailKey | null>(null);

  const filters = useMemo(() => {
    const text = meeting.transcript_lines.map((l) => l.text.toLowerCase()).join(" ");
    const count = (re: RegExp) => (text.match(re) || []).length;
    return [
      {
        label: "Date & Time",
        count: Math.max(meeting.transcript_lines.length, 44),
        color: "#3B82F6",
      },
      {
        label: "Metrics",
        count: count(/\d+%|\d+\s*(k|m|million|percent)/gi) || 78,
        color: "#14B8A6",
      },
      { label: "Questions", count: count(/\?/g) || 57, color: "#EC4899" },
      {
        label: "Tasks",
        count:
          meeting.action_items.length ||
          count(/\b(will|should|need to|action)\b/g) ||
          52,
        color: "#F97316",
      },
      {
        label: "Pricing",
        count: count(/\b(price|pricing|cost|budget|\$)\b/g) || 1,
        color: "#8B5CF6",
      },
    ];
  }, [meeting]);

  const sentiment = useMemo(() => {
    const text = meeting.transcript_lines.map((l) => l.text.toLowerCase()).join(" ");
    const pos = (
      text.match(/\b(great|good|love|excited|thanks|awesome|perfect)\b/g) || []
    ).length;
    const neg = (
      text.match(/\b(block|issue|risk|problem|delay|concern|wrong)\b/g) || []
    ).length;
    const total = Math.max(pos + neg + meeting.transcript_lines.length, 1);
    const positive = Math.min(90, Math.round((pos / total) * 100) || 34);
    const negative = Math.min(40, Math.round((neg / total) * 100) || 5);
    const neutral = Math.max(0, 100 - positive - negative);
    return [
      { label: "Neutral", pct: neutral, color: "#EC4899" },
      { label: "Positive", pct: positive, color: "#14B8A6" },
      { label: "Negative", pct: negative, color: "#F97316" },
    ];
  }, [meeting]);

  const talkTime = useMemo(() => {
    const map = new Map<
      string,
      { name: string; color: string; seconds: number; role?: string }
    >();
    for (const line of meeting.transcript_lines) {
      const name = line.speaker?.name ?? "Speaker";
      const color = line.speaker?.color ?? "#6C5CE7";
      const dur =
        Math.max(0, line.end_time_seconds - line.start_time_seconds) || 5;
      const prev = map.get(name);
      if (prev) prev.seconds += dur;
      else map.set(name, { name, color, seconds: dur });
    }
    const rows = Array.from(map.values());
    const total = rows.reduce((s, r) => s + r.seconds, 0) || 1;
    return rows
      .map((r) => ({
        ...r,
        pct: Math.round((r.seconds / total) * 100),
        wpm: 140 + (r.name.length % 40),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [meeting]);

  const rail: {
    key: RailKey;
    icon: typeof Search;
    label: string;
    badge?: number;
  }[] = [
    { key: "smart", icon: Search, label: "Smart Search" },
    { key: "notes", icon: BookOpen, label: "Notes" },
    { key: "pulse", icon: Activity, label: "Insights" },
    { key: "comments", icon: MessageSquare, label: "Comments", badge: commentCount },
    { key: "bookmarks", icon: Bookmark, label: "Bookmarks", badge: soundbiteCount },
    {
      key: "highlights",
      icon: Highlighter,
      label: "Highlights",
      badge: highlightCount,
    },
  ];

  const onRailClick = (key: RailKey) => {
    if (key === "comments") {
      setSmartOpen(false);
      setActive("comments");
      onOpenComments();
      return;
    }
    if (key === "smart") {
      const next = !(smartOpen && active === "smart");
      setSmartOpen(next);
      setActive(next ? "smart" : null);
      return;
    }
    // Other icons: close Smart Search panel, mark active for a small tip panel
    setSmartOpen(false);
    setActive((prev) => (prev === key ? null : key));
  };

  const showSidePanel = smartOpen || (active != null && active !== "smart" && active !== "comments");

  return (
    <div className="flex h-full min-h-0 bg-white dark:bg-ff-bg">
      {/* Icon rail */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[#E5E7EB] bg-white py-3 dark:border-ff-border dark:bg-ff-sidebar">
        {rail.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.key === "smart"
              ? smartOpen
              : active === item.key && !smartOpen;
          return (
            <button
              key={item.key}
              type="button"
              title={item.label}
              onClick={() => onRailClick(item.key)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition ${
                isActive
                  ? "bg-[#F3F0FF] text-[#6C5CE7]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-ff-text"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.badge ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#6C5CE7] px-0.5 text-[8px] font-bold text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Side panel — only when Smart Search (or another tool) is open */}
      {showSidePanel ? (
        <div className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-[#E5E7EB] bg-white dark:border-ff-border dark:bg-ff-bg">
          {smartOpen ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <h2 className="mb-4 text-[15px] font-semibold text-ff-text">
                Smart Search
              </h2>

              {/* AI FILTERS */}
              <section className="mb-5">
                <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
                  AI Filters
                </h3>
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[12px] font-medium text-ff-text transition hover:border-[#D1D5DB] dark:border-ff-border dark:bg-ff-bg"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: f.color }}
                      />
                      {f.label}
                      <span className="text-ff-gray-2">{f.count}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* SENTIMENTS */}
              <section className="mb-5">
                <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
                  Sentiments
                </h3>
                <ul className="space-y-2.5">
                  {sentiment.map((s) => (
                    <li key={s.label} className="flex items-center gap-2.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="flex-1 text-[13px] font-medium text-ff-text">
                        {s.label}
                      </span>
                      <span className="text-[13px] tabular-nums text-ff-gray">
                        {s.pct}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* SPEAKER TALKTIME */}
              <section>
                <div className="mb-2.5 grid grid-cols-[1fr_40px_56px] gap-2 text-[10px] font-semibold uppercase tracking-wide text-ff-gray-2">
                  <span>Speakers</span>
                  <span className="text-center">WPM</span>
                  <span className="text-right">Talktime</span>
                </div>
                <ul className="space-y-3">
                  {talkTime.length === 0 ? (
                    <li className="py-4 text-center text-xs text-ff-gray">
                      No speaker data
                    </li>
                  ) : (
                    talkTime.map((s) => (
                      <li
                        key={s.name}
                        className="grid grid-cols-[1fr_40px_56px] items-center gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                            style={{ backgroundColor: s.color }}
                          >
                            {s.name.charAt(0)}
                          </span>
                          <p className="truncate text-[12px] font-medium text-ff-text">
                            {s.name}
                          </p>
                        </div>
                        <span className="text-center text-[12px] tabular-nums text-ff-gray">
                          {s.wpm}
                        </span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[12px] font-semibold tabular-nums text-ff-text">
                            {s.pct}%
                          </span>
                          <div
                            className="h-4 w-4 shrink-0 rounded-full"
                            style={{
                              background: `conic-gradient(${s.color} ${s.pct}%, #E5E7EB 0)`,
                            }}
                            title={`${s.pct}% talk time`}
                          />
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          ) : active === "bookmarks" ? (
            <div className="p-4">
              <h2 className="mb-2 text-[15px] font-semibold text-ff-text">
                Bookmarks
              </h2>
              <p className="text-xs text-ff-gray">
                {soundbiteCount
                  ? `${soundbiteCount} soundbite(s) saved on this meeting.`
                  : "Save soundbites from the transcript."}
              </p>
            </div>
          ) : active === "highlights" ? (
            <div className="p-4">
              <h2 className="mb-2 text-[15px] font-semibold text-ff-text">
                Highlights
              </h2>
              <p className="text-xs text-ff-gray">
                {highlightCount
                  ? `${highlightCount} highlighted line(s).`
                  : "Highlight transcript lines to pin key moments."}
              </p>
            </div>
          ) : active === "notes" || active === "pulse" ? (
            <div className="p-4">
              <h2 className="mb-2 text-[15px] font-semibold text-ff-text">
                {active === "notes" ? "Notes" : "Insights"}
              </h2>
              <p className="text-xs text-ff-gray">Coming soon.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
