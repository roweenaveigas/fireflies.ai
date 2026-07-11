"use client";

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  Lock,
  MoreHorizontal,
  Smile,
  Star,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatMeetingDate } from "@/lib/format";
import { fetchMeeting, fetchMeetings } from "@/lib/meetings";
import type { MeetingDetail, MeetingListItem } from "@/lib/types";

export default function DigestPage() {
  const [meeting, setMeeting] = useState<MeetingListItem | null>(null);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchMeetings({ sort: "recency" });
        const first = list.meetings[0] ?? null;
        if (cancelled) return;
        setMeeting(first);
        if (first) {
          const d = await fetchMeeting(first.id);
          if (!cancelled) setDetail(d);
        }
      } catch {
        if (!cancelled) {
          setMeeting(null);
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openTasks =
    detail?.action_items?.filter((a) => !a.is_completed) ?? [];

  return (
    <div className="relative min-h-[calc(100vh-7.5rem)] bg-white pb-28 dark:bg-ff-bg">
      {/* Breadcrumb row is also in TopBar title; show in-page trail */}
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
          <span className="font-medium text-ff-text">Daily Digest</span>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-semibold tracking-tight text-ff-text">
                Daily Digest
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
                Productivity
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-ff-gray">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-[9px] font-bold text-white">
                  Y
                </span>
                You
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Only me
              </span>
              <span className="inline-flex items-center gap-1">
                <Video className="h-3 w-3" />
                Per Meeting
              </span>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] font-medium text-ff-text dark:border-ff-border dark:bg-ff-bg"
          >
            <Calendar className="h-3.5 w-3.5 text-ff-gray" />
            This Month
          </button>
        </div>

        {/* Meeting entry bar */}
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#F3F4F6] px-3 py-2.5 text-[13px] text-ff-gray dark:bg-[var(--ff-input-bg)]">
          <Video className="h-3.5 w-3.5 shrink-0" />
          {loading ? (
            <span className="ff-skeleton h-4 w-48" />
          ) : (
            <span>
              1 meeting{" "}
              {meeting
                ? formatMeetingDate(meeting.date)
                : "Jan 9, 12:42 PM"}
            </span>
          )}
          <button
            type="button"
            className="ml-auto rounded p-1 text-ff-gray-2 hover:bg-white"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Digest body */}
        <article className="mt-5 space-y-6">
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ff-text">
              <span aria-hidden>📌</span> Daily Digest
            </h2>
            <p className="text-[14px] leading-relaxed text-ff-gray">
              {detail?.summary?.overview_text?.slice(0, 220) ||
                meeting?.summary_preview ||
                "Highlights from your recent meetings appear here."}
              {(detail?.summary?.overview_text?.length ?? 0) > 220 ? "…" : ""}
            </p>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ff-text">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                ●
              </span>
              Action Items
            </h2>
            <ul className="space-y-1.5 text-[14px] text-ff-gray">
              {openTasks.length === 0 ? (
                <li>
                  • None identified for you ([me]) in this meeting.
                </li>
              ) : (
                openTasks.slice(0, 5).map((t) => (
                  <li key={t.id}>
                    • {t.text}
                    {t.assignee ? (
                      <span className="text-ff-gray-2"> — {t.assignee}</span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ff-text">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                ●
              </span>
              FYI
            </h2>
            <ul className="space-y-1.5 text-[14px] text-ff-gray">
              <li>
                • None identified (external dependencies, permissions, or
                cross-team dependencies not evident in the discussion).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ff-text">
              <span className="text-[16px]" aria-hidden>
                ⛔
              </span>
              Blockers
            </h2>
            <ul className="space-y-1.5 text-[14px] text-ff-gray">
              <li>
                • None identified (no critical decisions, system/access blockers,
                or resource constraints discussed).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-ff-text">
              <span className="text-[16px]" aria-hidden>
                ❓
              </span>
              Open Questions
            </h2>
            <ul className="space-y-1.5 text-[14px] text-ff-gray">
              <li>
                • None identified (top-priority questions not raised in the
                transcript).
              </li>
            </ul>
          </section>

          {/* Feedback */}
          <div className="border-t border-[#E5E7EB] pt-5 dark:border-ff-border">
            <div className="flex flex-wrap items-center gap-3">
              <Smile className="h-4 w-4 text-ff-gray" />
              <p className="text-[13px] text-ff-gray">
                Did you like the above output?
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-0.5"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        n <= rating
                          ? "fill-[#FBBF24] text-[#FBBF24]"
                          : "text-[#D1D5DB]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Floating ask bar */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-2 shadow-lg dark:border-ff-border dark:bg-ff-bg">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6C5CE7] text-white">
            <Bot className="h-4 w-4" />
          </span>
          <input
            type="text"
            disabled
            placeholder="Ask anything from your meetings..."
            className="flex-1 border-0 bg-transparent text-[13px] text-ff-text outline-none placeholder:text-ff-gray-2"
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
