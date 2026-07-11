"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { updateMeeting } from "@/lib/meetings";
import type { MeetingDetail } from "@/lib/types";

type EditMeetingModalProps = {
  open: boolean;
  meeting: MeetingDetail;
  onClose: () => void;
  onSaved: (meeting: MeetingDetail) => void;
};

export function EditMeetingModal({
  open,
  meeting,
  onClose,
  onSaved,
}: EditMeetingModalProps) {
  const { success, error } = useToast();
  const [title, setTitle] = useState(meeting.title);
  const [participants, setParticipants] = useState(
    meeting.participants.map((p) => p.name).join(", ")
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(meeting.title);
    setParticipants(meeting.participants.map((p) => p.name).join(", "));
  }, [open, meeting]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error("Title is required.");
      return;
    }
    setBusy(true);
    try {
      const names = participants
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      const updated = await updateMeeting(meeting.id, {
        title: title.trim(),
        participants: names.map((name) => ({ name })),
      });
      success("Meeting details updated.");
      onSaved(updated);
      onClose();
    } catch {
      error("Failed to update meeting.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Edit meeting"
      description="Update the title and participants."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">
            Participants
          </span>
          <input
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="Comma-separated names"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
