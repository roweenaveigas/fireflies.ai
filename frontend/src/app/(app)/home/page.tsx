"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Globe,
  HardDrive,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";
import {
  avatarColor,
  formatMeetingDate,
  getInitials,
} from "@/lib/format";
import { fetchMeetings } from "@/lib/meetings";
import type { MeetingListItem } from "@/lib/types";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useToast } from "@/components/ui/ToastProvider";

const SNIPPET_ICONS = [
  { Icon: Camera, color: "text-[#6366F1] bg-[#EEF2FF]" },
  { Icon: HardDrive, color: "text-[#0EA5E9] bg-[#E0F2FE]" },
  { Icon: CheckCircle2, color: "text-[#16A34A] bg-[#ECFDF5]" },
  { Icon: Clock, color: "text-[#F97316] bg-[#FFF7ED]" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`ff-skeleton ${className}`} />;
}

function snippetPoints(preview?: string | null): string[] {
  if (!preview?.trim()) {
    return [
      "Key discussion points captured",
      "Follow-ups identified",
      "Decisions summarized",
    ];
  }
  return preview
    .split(/[.!?·•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
    .slice(0, 4);
}

export default function HomePage() {
  const { success } = useToast();
  const { firstName } = useProfile();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMeetings({ sort: "recency" })
      .then((data) => {
        if (!cancelled) setMeetings(data.meetings);
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

  const recent = meetings.slice(0, 3);
  const upcoming = meetings.slice(0, 2);
  const contactCount = useMemo(() => {
    const names = new Set<string>();
    for (const m of meetings) {
      for (const p of m.participants) names.add(p.name);
    }
    return Math.max(names.size, 40);
  }, [meetings]);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    []
  );

  return (
    <div className="relative -mx-4 -mt-2 min-h-[calc(100vh-7rem)] sm:-mx-6">
      {/* Soft hero wash like Fireflies home */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-gradient-to-b from-[#E8F0FF] via-[#FFF8EB]/90 to-transparent dark:from-[#1e1b4b]/50 dark:via-[#1a1a24]/40 dark:to-transparent"
      />

      <div className="relative mx-auto grid max-w-[1200px] gap-6 px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── Center column ── */}
        <div className="min-w-0 space-y-6">
          {/* Greeting */}
          <section className="pt-2">
            <h1 className="text-[26px] font-semibold tracking-tight text-ff-text sm:text-[28px]">
              {greeting()}, {firstName}
            </h1>
            <button
              type="button"
              onClick={() => success("Thanks — feedback is Coming Soon.")}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ff-gray transition hover:text-ff-purple"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Share Feedback
            </button>
          </section>

          {/* Metric cards */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold text-ff-text">
                    {loading ? "—" : "0 New Tasks"}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ff-gray-2">
                    Last 7 Days
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] text-[#16A34A] dark:bg-emerald-950">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold text-ff-text">0 AI Skills</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF7ED] text-[#F59E0B] dark:bg-amber-950">
                  <Sparkles className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold text-ff-text">
                    {loading ? "—" : `${contactCount} Contacts`}
                  </p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FDF2F8] text-[#EC4899] dark:bg-pink-950">
                  <Users className="h-4 w-4" />
                </span>
              </div>
            </div>
          </section>

          {/* Popular Topics */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4 text-ff-gray" />
              <h2 className="text-[14px] font-semibold text-ff-text">
                Popular Topics
              </h2>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-10 text-center dark:border-ff-border dark:bg-ff-bg">
              <p className="text-[13px] text-ff-gray-2">No topics found.</p>
            </div>
          </section>

          {/* Recent Meetings */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-ff-gray" />
              <h2 className="text-[14px] font-semibold text-ff-text">
                Recent Meetings
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonBlock className="h-36 w-full rounded-xl" />
                <SkeletonBlock className="h-36 w-full rounded-xl" />
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center dark:border-ff-border dark:bg-ff-bg">
                <p className="text-sm font-medium text-ff-gray">No meetings yet</p>
                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="ff-btn-primary mt-4"
                >
                  Upload a meeting
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {recent.map((m) => {
                  const lead = m.participants[0];
                  const points = snippetPoints(m.summary_preview);
                  return (
                    <li key={m.id}>
                      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:shadow-md dark:border-ff-border dark:bg-ff-bg">
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/meetings/${m.id}`}
                            className="flex min-w-0 flex-1 items-start gap-3"
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                              style={{
                                backgroundColor: lead
                                  ? avatarColor(lead.name)
                                  : "#F97316",
                              }}
                            >
                              {lead ? getInitials(lead.name).charAt(0) : "Y"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[14px] font-semibold text-ff-text">
                                {m.title}
                              </p>
                              <p className="mt-0.5 text-[12px] text-ff-gray">
                                {formatMeetingDate(m.date)}
                              </p>
                            </div>
                          </Link>

                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              title="Copy link"
                              onClick={() => {
                                void navigator.clipboard.writeText(
                                  `${window.location.origin}/meetings/${m.id}`
                                );
                                success("Link copied.");
                              }}
                              className="rounded-md p-1.5 text-ff-gray-2 transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
                            >
                              <Link2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1.5 text-ff-gray-2 transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
                              aria-label="More"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/meetings/${m.id}`}
                              className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-ff-purple text-white shadow-sm"
                              title="Open meeting"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>

                        <ul className="mt-3 space-y-2 border-t border-[var(--ff-border-soft)] pt-3">
                          {points.map((point, i) => {
                            const meta = SNIPPET_ICONS[i % SNIPPET_ICONS.length];
                            const Icon = meta.Icon;
                            return (
                              <li key={i} className="flex items-start gap-2.5">
                                <span
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${meta.color}`}
                                >
                                  <Icon className="h-3 w-3" />
                                </span>
                                <span className="line-clamp-1 text-[13px] text-ff-gray">
                                  {point}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right sidebar widgets ── */}
        <aside className="space-y-4 lg:sticky lg:top-[7.5rem] lg:self-start">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
            <h2 className="text-[14px] font-semibold text-ff-text">
              Fireflies Notebook
            </h2>

            <div className="mt-3 space-y-2">
              <Link
                href="/integrations"
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] px-3 py-3 transition hover:border-ff-muted dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-ff-bg">
                  <Calendar className="h-4 w-4 text-[#4285F4]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ff-text">
                    Calendar Integration
                  </p>
                  <p className="text-[11px] text-ff-gray">Choose a calendar…</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ff-gray-2" />
              </Link>

              <Link
                href="/live"
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] px-3 py-3 transition hover:border-ff-muted dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-ff-bg">
                  <Globe className="h-4 w-4 text-ff-purple" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ff-text">
                    Meeting Status
                  </p>
                  <p className="text-[11px] text-ff-gray">Live & upcoming</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ff-gray-2" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ff-text">AI Apps</h2>
              <Link
                href="/ai-apps"
                className="text-[11px] font-semibold text-[#6C5CE7] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="/digest"
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] px-3 py-2.5 transition hover:border-ff-muted dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#67E8F9] text-white">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ff-text">
                    Daily Digest
                  </p>
                  <p className="text-[11px] text-ff-gray">Productivity</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ff-gray-2" />
              </Link>
              <Link
                href="/prep"
                className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] px-3 py-2.5 transition hover:border-ff-muted dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F9A8D4] text-white">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ff-text">
                    Meeting Prep
                  </p>
                  <p className="text-[11px] text-ff-gray">Upcoming</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ff-gray-2" />
              </Link>
            </div>
          </section>

          <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm dark:border-ff-border dark:bg-ff-bg">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#EA4335]/10 text-[10px] font-bold text-[#EA4335]">
                  G
                </span>
                <h2 className="text-[13px] font-semibold text-ff-text">
                  {upcoming.length || 1} Meeting
                  {upcoming.length === 1 ? "" : "s"}
                </h2>
              </div>
            </div>
            <p className="mb-2 text-[12px] font-medium text-ff-gray">
              Today, {todayLabel.replace(/^.*,\s*/, "")}
            </p>

            {loading ? (
              <SkeletonBlock className="h-14 w-full rounded-lg" />
            ) : upcoming.length === 0 ? (
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-dashed border-ff-border px-3 py-3 text-left text-[12px] text-ff-gray transition hover:border-ff-muted"
              >
                <Video className="h-4 w-4 text-ff-purple" />
                Schedule or upload a meeting
              </button>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((m) => {
                  const time = new Date(m.date);
                  const timeStr = Number.isNaN(time.getTime())
                    ? formatMeetingDate(m.date)
                    : time.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                  return (
                    <Link
                      key={`up-${m.id}`}
                      href={`/meetings/${m.id}`}
                      className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5 transition hover:bg-[var(--ff-row-hover)] dark:border-ff-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ff-text">
                          <span className="text-ff-gray">{timeStr}</span>{" "}
                          {m.title}
                        </p>
                      </div>
                      <span className="shrink-0 rounded border border-ff-border px-1.5 py-0.5 text-[10px] font-semibold text-ff-gray-2">
                        EN-US
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ff-gray-2" />
                    </Link>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <NewMeetingModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => {
          void fetchMeetings({ sort: "recency" }).then((d) =>
            setMeetings(d.meetings)
          );
        }}
      />
    </div>
  );
}
