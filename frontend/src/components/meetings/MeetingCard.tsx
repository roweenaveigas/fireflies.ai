"use client";

import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { MeetingListItem, Participant } from "@/lib/types";
import {
  avatarColor,
  formatDuration,
  formatMeetingDate,
  getInitials,
} from "@/lib/format";

function ParticipantAvatars({ participants }: { participants: Participant[] }) {
  const shown = participants.slice(0, 4);
  const extra = participants.length - shown.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((p) => (
          <span
            key={p.id}
            title={p.name}
            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white"
            style={{ backgroundColor: avatarColor(p.name) }}
          >
            {getInitials(p.name)}
          </span>
        ))}
        {extra > 0 ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E8E8EF] text-[9px] font-semibold text-ff-gray">
            +{extra}
          </span>
        ) : null}
      </div>
      <p className="ml-2.5 hidden max-w-[200px] truncate text-xs text-ff-gray sm:block">
        {participants.map((p) => p.name.split(" ")[0]).join(", ")}
      </p>
    </div>
  );
}

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  const duration = meeting.duration ?? meeting.duration_minutes;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="ff-card ff-card-hover group block p-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-ff-text transition group-hover:text-[#6C5CE7]">
            {meeting.title}
          </h3>
          {meeting.summary_preview ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ff-gray">
              {meeting.summary_preview}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ff-gray-2 sm:flex-col sm:items-end">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatMeetingDate(meeting.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--ff-border-soft)] pt-3">
        <ParticipantAvatars participants={meeting.participants} />
        <span className="text-[12px] font-medium text-[#6C5CE7] opacity-0 transition group-hover:opacity-100">
          Open →
        </span>
      </div>
    </Link>
  );
}
