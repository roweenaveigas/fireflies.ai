"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteMeeting } from "@/lib/meetings";

type DeleteMeetingModalProps = {
  open: boolean;
  meetingId: number;
  meetingTitle: string;
  onClose: () => void;
  /** When provided (e.g. meetings list), refresh in place instead of navigating. */
  onDeleted?: () => void;
};

export function DeleteMeetingModal({
  open,
  meetingId,
  meetingTitle,
  onClose,
  onDeleted,
}: DeleteMeetingModalProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    setBusy(true);
    try {
      await deleteMeeting(meetingId);
      success("Meeting deleted.");
      onClose();
      if (onDeleted) onDeleted();
      else router.push("/meetings");
    } catch {
      error("Failed to delete meeting.");
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Delete meeting?"
      description="This permanently removes the transcript, summary, and action items."
    >
      <p className="text-sm text-slate-600">
        Delete{" "}
        <span className="font-semibold text-slate-900">{meetingTitle}</span>?
        This cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Delete meeting
        </button>
      </div>
    </Modal>
  );
}
