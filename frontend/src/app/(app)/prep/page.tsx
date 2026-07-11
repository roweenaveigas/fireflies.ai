"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare,
  Handshake,
  Monitor,
  MoreHorizontal,
  PencilRuler,
  Search,
  Wrench,
} from "lucide-react";
import { avatarColor, formatMeetingDate, getInitials } from "@/lib/format";
import { fetchMeeting, fetchMeetings } from "@/lib/meetings";
import type { ActionItem, MeetingDetail, MeetingListItem } from "@/lib/types";

const TOPIC_ICONS = [Wrench, Search, Monitor, BarChart3, Handshake, PencilRuler];

function groupByDate(meetings: MeetingListItem[]) {
  const map = new Map<string, MeetingListItem[]>();
  for (const m of meetings) {
    const d = new Date(m.date);
    const label = Number.isNaN(d.getTime())
      ? "Upcoming"
      : d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(m);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function PrepPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMeetings({ sort: "recency" })
      .then((data) => {
        if (cancelled) return;
        setMeetings(data.meetings);
        if (data.meetings[0]) setSelectedId(data.meetings[0].id);
      })
      .catch(() => {
        if (!cancelled) setMeetings([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchMeeting(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selected = meetings.find((m) => m.id === selectedId) ?? null;
  const groups = useMemo(() => groupByDate(meetings.slice(0, 8)), [meetings]);
  const tasks: ActionItem[] = detail?.action_items ?? [];
  const topics =
    detail?.key_topics?.length
      ? detail.key_topics.map((t) => t.topic_text)
      : [
          "Migration Errors Resolved",
          "Backend Issues Identified",
          "Dashboard Updates Needed",
          "Workflow Clarified",
          "Synchronous Meetings for Clarity",
          "Ongoing Collaboration Emphasized",
        ];

  const host = selected?.participants[0];
  const hostName = host?.name ?? "You";
  const extra = Math.max(0, (selected?.participants.length ?? 1) - 1);

  const timeStr = (() => {
    if (!selected) return "";
    const d = new Date(selected.date);
    if (Number.isNaN(d.getTime())) return formatMeetingDate(selected.date);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  return (
    <div className="relative flex min-h-[calc(100vh-7.5rem)] bg-white dark:bg-ff-bg">
      {/* Meeting Prep list panel */}
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#E5E7EB] dark:border-ff-border lg:flex">
        <div className="border-b border-[#E5E7EB] p-4 dark:border-[var(--ff-border-soft)]">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCE7F3] text-[#DB2777]">
              <CalendarDays className="h-4 w-4" />
            </span>
            <h2 className="flex-1 text-[15px] font-semibold text-ff-text">
              Meeting Prep
            </h2>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative h-5 w-9 rounded-full transition ${
                enabled ? "bg-[#6C5CE7]" : "bg-[#D1D5DB]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                  enabled ? "left-4" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-ff-gray">
            Prep for upcoming meetings with notes from past syncs, action items
            & company insights.
          </p>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-[13px] font-semibold text-ff-text">
            {meetings.length} Meeting Prep{meetings.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            className="rounded-md p-1 text-ff-gray hover:bg-[#F3F4F6]"
            aria-label="Add"
          >
            <span className="text-lg leading-none">+</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading ? (
            <div className="space-y-2 p-2">
              <div className="ff-skeleton h-16 w-full" />
              <div className="ff-skeleton h-16 w-full" />
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-3">
                <p className="mb-1.5 px-2 text-[11px] font-semibold text-ff-gray-2">
                  {g.label}
                </p>
                <ul className="space-y-1">
                  {g.items.map((m) => {
                    const active = m.id === selectedId;
                    const t = new Date(m.date);
                    const ts = Number.isNaN(t.getTime())
                      ? ""
                      : t.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(m.id)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            active
                              ? "border-[#6C5CE7]/40 bg-[#F3F0FF]"
                              : "border-transparent hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] text-ff-gray">
                                {ts}
                              </p>
                              <p
                                className={`truncate text-[13px] font-semibold ${
                                  active ? "text-[#6C5CE7]" : "text-ff-text"
                                }`}
                              >
                                {m.title}
                              </p>
                            </div>
                            <span className="rounded border border-[#E5E7EB] px-1 text-[9px] font-semibold text-ff-gray-2">
                              EN
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Detail */}
      <div className="relative min-w-0 flex-1 overflow-y-auto pb-28">
        <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-ff-border sm:px-8">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ff-gray">
            <Link href="/home" className="hover:text-[#6C5CE7]">
              Home
            </Link>
            <span>/</span>
            <Link href="/ai-apps" className="hover:text-[#6C5CE7]">
              AI Apps
            </Link>
            <span>/</span>
            <span className="font-medium text-ff-text">Meeting Prep</span>
          </div>
        </div>

        <div className="mx-auto max-w-[720px] px-5 py-6 sm:px-8">
          {!selected && !loading ? (
            <p className="py-20 text-center text-sm text-ff-gray">
              Select a meeting to prep.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-[24px] font-semibold tracking-tight text-ff-text">
                    {selected?.title ?? "…"}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-ff-gray">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: avatarColor(hostName) }}
                      >
                        {getInitials(hostName).charAt(0)}
                      </span>
                      {hostName}
                      {extra > 0 ? ` +${extra}` : ""}
                    </span>
                    <span>
                      {selected ? formatMeetingDate(selected.date) : ""}
                      {timeStr ? ` - ${timeStr}` : ""}
                    </span>
                    <span>English (Global)</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-teal-600">
                    Upcoming
                  </span>
                  {selected ? (
                    <Link
                      href={`/meetings/${selected.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-semibold text-ff-text shadow-sm transition hover:border-[#6C5CE7]/40 dark:border-ff-border dark:bg-ff-bg"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-[#34A853] text-[8px] font-bold text-white">
                        G
                      </span>
                      Join
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* From last meeting */}
              <section className="mt-8">
                <h2 className="text-[14px] font-semibold text-[#6C5CE7]">
                  From last {selected?.title?.split("—")[0]?.trim() || "meeting"}
                </h2>
                <p className="mt-0.5 text-[12px] text-ff-gray-2">
                  Previous sync notes
                </p>
                <ul className="mt-4 space-y-3">
                  {topics.slice(0, 6).map((topic, i) => {
                    const Icon = TOPIC_ICONS[i % TOPIC_ICONS.length];
                    return (
                      <li key={topic} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F3F0FF] text-[#6C5CE7]">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-[14px] font-semibold text-ff-text">
                            {topic.length > 48
                              ? topic.slice(0, 48) + "…"
                              : topic}
                          </p>
                          <p className="mt-0.5 text-[13px] text-ff-gray">
                            Key takeaway from your previous conversation.
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Tasks */}
              <section className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-ff-gray" />
                  <h2 className="text-[14px] font-semibold text-ff-text">
                    {tasks.length || 0} Tasks
                  </h2>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-[13px] text-ff-gray">
                    No open tasks from the last meeting.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg py-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          readOnly
                          className="h-4 w-4 rounded border-ff-border text-[#6C5CE7]"
                        />
                        <span
                          className={`min-w-0 flex-1 text-[14px] ${
                            item.is_completed
                              ? "text-ff-gray line-through"
                              : "text-ff-text"
                          }`}
                        >
                          {item.text}
                        </span>
                        <span className="shrink-0 text-[12px] text-ff-gray">
                          {item.assignee ?? "You"}
                        </span>
                        <button
                          type="button"
                          className="rounded p-1 text-ff-gray-2 hover:bg-[#F3F4F6]"
                          aria-label="More"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Floating ask */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 shadow-lg dark:border-ff-border dark:bg-ff-bg">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7] text-white">
            <Bot className="h-4 w-4" />
          </span>
          <input
            type="text"
            disabled
            placeholder="Ask anything from your meetings..."
            className="flex-1 border-0 bg-transparent text-[13px] outline-none placeholder:text-ff-gray-2"
          />
          <button
            type="button"
            disabled
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7]/40 text-white"
            aria-label="Send"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
