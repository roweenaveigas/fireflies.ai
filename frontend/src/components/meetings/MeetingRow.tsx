"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  MessageSquare,
  MoreHorizontal,
  Monitor,
  Pencil,
  Trash2,
} from "lucide-react";
import { DeleteMeetingModal } from "@/components/meetings/DeleteMeetingModal";
import { EditMeetingModal } from "@/components/meetings/EditMeetingModal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  avatarColor,
  formatDuration,
  formatMeetingDate,
  getInitials,
} from "@/lib/format";
import { fetchMeeting } from "@/lib/meetings";
import type { MeetingDetail, MeetingListItem } from "@/lib/types";

type MeetingRowProps = {
  meeting: MeetingListItem;
  onChanged: () => void;
};

export function MeetingRow({ meeting, onChanged }: MeetingRowProps) {
  const router = useRouter();
  const { success } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [checked, setChecked] = useState(false);

  const duration = meeting.duration ?? meeting.duration_minutes;
  const host = meeting.participants[0];
  const hostName = host?.name ?? "Maya Rivera";
  const initial = getInitials(hostName).charAt(0) || "M";
  const participantLabel = (() => {
    const names = meeting.participants.map((p) => p.name.split(" ")[0]);
    if (names.length === 0) return "No participants";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]}, ${names[1]}`;
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  })();

  const metaLine = (() => {
    const d = new Date(meeting.date);
    if (Number.isNaN(d.getTime())) {
      return `${formatMeetingDate(meeting.date)} · ${formatDuration(duration)} · ${participantLabel}`;
    }
    const datePart = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
    const timePart = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart} · ${formatDuration(duration)} · ${participantLabel}`;
  })();

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const openRename = async () => {
    setMenuOpen(false);
    setLoadingEdit(true);
    try {
      const full = await fetchMeeting(meeting.id);
      setDetail(full);
      setEditOpen(true);
    } catch {
      setDetail({
        id: meeting.id,
        title: meeting.title,
        date: meeting.date,
        duration_minutes: duration,
        created_at: meeting.date,
        updated_at: meeting.date,
        participants: meeting.participants,
        speakers: [],
        transcript_lines: [],
        summary: null,
        key_topics: [],
        action_items: [],
        tags: [],
      });
      setEditOpen(true);
    } finally {
      setLoadingEdit(false);
    }
  };

  return (
    <>
      <div className="group relative flex items-center gap-2.5 border-b border-[var(--ff-border-soft)] px-3 py-3 transition hover:bg-[#F9FAFB] last:border-b-0 dark:hover:bg-[var(--ff-row-hover)] sm:gap-3 sm:px-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-ff-border text-[#6C5CE7] focus:ring-[#6C5CE7]/30"
          aria-label={`Select ${meeting.title}`}
        />

        <Link
          href={`/meetings/${meeting.id}`}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: avatarColor(hostName) }}
          >
            {initial}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[14px] font-semibold text-ff-text transition group-hover:text-[#6C5CE7]">
                {meeting.title}
              </p>
              <Monitor className="h-3.5 w-3.5 shrink-0 text-ff-gray-2 opacity-50" />
              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-ff-gray-2 opacity-40" />
            </div>
            <p className="mt-0.5 truncate text-[12px] text-ff-gray">{metaLine}</p>
            {meeting.summary_preview ? (
              <p className="mt-1 line-clamp-1 text-[12px] text-ff-gray-2">
                {meeting.summary_preview}
              </p>
            ) : null}
          </div>
        </Link>

        <div
          className="relative flex shrink-0 items-center gap-1.5"
          ref={menuRef}
        >
          <Link
            href={`/meetings/${meeting.id}`}
            className="hidden items-center gap-1 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ff-text opacity-0 shadow-sm transition hover:border-ff-muted group-hover:opacity-100 dark:border-ff-border dark:bg-ff-bg sm:inline-flex"
          >
            Details
            <span className="text-ff-gray-2">›</span>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="rounded-lg p-1.5 text-ff-gray-2 opacity-100 transition hover:bg-[#F3F0FF] hover:text-[#6C5CE7] sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Meeting actions"
            disabled={loadingEdit}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen ? (
            <div className="ff-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="ff-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(`/meetings/${meeting.id}`);
                }}
              >
                Open
              </button>
              <button
                type="button"
                role="menuitem"
                className="ff-menu-item"
                onClick={() => void openRename()}
              >
                <Pencil className="h-3.5 w-3.5 text-ff-gray-2" />
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                className="ff-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  success("Duplicate is coming soon.");
                }}
              >
                <Copy className="h-3.5 w-3.5 text-ff-gray-2" />
                Duplicate
              </button>
              <div className="my-1 border-t border-[var(--ff-border-soft)]" />
              <button
                type="button"
                role="menuitem"
                className="ff-menu-item-danger"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {detail ? (
        <EditMeetingModal
          open={editOpen}
          meeting={detail}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onChanged();
          }}
        />
      ) : null}

      <DeleteMeetingModal
        open={deleteOpen}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onChanged}
      />
    </>
  );
}
