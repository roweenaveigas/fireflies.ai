"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { FileUp, Loader2, PenLine, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { createMeeting } from "@/lib/meetings";
import {
  autoGenerateFromTranscript,
  normalizeTranscriptFile,
} from "@/lib/transcriptParse";

type Mode = "choose" | "upload" | "manual";

type NewMeetingModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NewMeetingModal({
  open,
  onClose,
  onCreated,
}: NewMeetingModalProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [busy, setBusy] = useState(false);

  // Upload path
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");

  // Manual path
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [participants, setParticipants] = useState("");

  const reset = () => {
    setMode("choose");
    setBusy(false);
    setPaste("");
    setFileName(null);
    setUploadTitle("");
    setTitle("");
    setDate(todayInputValue());
    setParticipants("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!/\.(txt|vtt|json)$/.test(lower)) {
      error("Please upload a .txt, .vtt, or .json transcript file.");
      return;
    }
    try {
      const raw = await file.text();
      const normalized = normalizeTranscriptFile(file.name, raw);
      setPaste(normalized);
      setFileName(file.name);
      if (!uploadTitle.trim()) {
        setUploadTitle(
          autoGenerateFromTranscript(normalized, file.name).title
        );
      }
    } catch {
      error("Could not read that file.");
    }
  };

  const submitUpload = async (e: FormEvent) => {
    e.preventDefault();
    const text = paste.trim();
    if (!text) {
      error("Paste a transcript or upload a file first.");
      return;
    }
    setBusy(true);
    try {
      const draft = autoGenerateFromTranscript(text, fileName ?? undefined);
      const created = await createMeeting({
        title: (uploadTitle.trim() || draft.title).slice(0, 255),
        date: new Date().toISOString(),
        transcript_text: draft.transcriptText,
        participants: draft.participants,
        summary: draft.summary,
        key_topics: draft.key_topics,
        action_items: draft.action_items,
      });
      success("Meeting created from transcript.");
      reset();
      onClose();
      onCreated?.();
      router.push(`/meetings/${created.id}`);
    } catch {
      error("Failed to create meeting from transcript.");
    } finally {
      setBusy(false);
    }
  };

  const submitManual = async (e: FormEvent) => {
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
      const created = await createMeeting({
        title: title.trim(),
        date: date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
        participants: names.map((name) => ({ name })),
      });
      success("Empty meeting created.");
      reset();
      onClose();
      onCreated?.();
      router.push(`/meetings/${created.id}`);
    } catch {
      error("Failed to create meeting.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Meeting"
      description="Upload a transcript or create an empty meeting shell."
      size="lg"
    >
      {mode === "choose" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-left transition hover:border-brand/40 hover:bg-brand-soft/40"
          >
            <Upload className="h-5 w-5 text-brand" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Paste / upload transcript
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              .txt, .vtt, or .json — we&apos;ll draft a title, summary, and
              action items.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-left transition hover:border-brand/40 hover:bg-brand-soft/40"
          >
            <PenLine className="h-5 w-5 text-brand" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Manual form
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Create an empty meeting with title, date, and participants.
            </p>
          </button>
        </div>
      ) : null}

      {mode === "upload" ? (
        <form onSubmit={submitUpload} className="space-y-4">
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="text-xs font-medium text-brand hover:underline"
          >
            ← Back
          </button>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Auto-generated if left blank"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand/40"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <FileUp className="h-6 w-6 text-brand" />
            <p className="mt-2 text-sm font-medium text-slate-800">
              Drop .txt / .vtt / .json here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {fileName ? `Loaded: ${fileName}` : "or click to browse"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.vtt,.json,text/plain,application/json"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">
              Or paste transcript
            </span>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={8}
              placeholder={"Maya: Let's kick off.\nJordan: Sounds good."}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
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
              Create from transcript
            </button>
          </div>
        </form>
      ) : null}

      {mode === "manual" ? (
        <form onSubmit={submitManual} className="space-y-4">
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="text-xs font-medium text-brand hover:underline"
          >
            ← Back
          </button>

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
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              onClick={handleClose}
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
              Create meeting
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
