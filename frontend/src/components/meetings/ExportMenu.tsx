"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import {
  exportMeetingMarkdown,
  exportMeetingPdf,
  exportMeetingText,
} from "@/lib/exportMeeting";
import type { MeetingDetail } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

type Tab = "transcript" | "summary" | "video" | "audio";

const TABS: { key: Tab; label: string }[] = [
  { key: "transcript", label: "Transcript" },
  { key: "summary", label: "Summary" },
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
];

export function ExportMenu({
  meeting,
  compact = false,
}: {
  meeting: MeetingDetail;
  compact?: boolean;
}) {
  const { success, error } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("transcript");
  const [format, setFormat] = useState<string | null>(null);

  const formatsForTab = (): { id: string; label: string; run?: () => void }[] => {
    if (tab === "transcript") {
      return [
        {
          id: "txt",
          label: "TXT",
          run: () => exportMeetingText(meeting),
        },
        {
          id: "md",
          label: "Markdown",
          run: () => exportMeetingMarkdown(meeting),
        },
        {
          id: "pdf",
          label: "PDF",
          run: () => exportMeetingPdf(meeting),
        },
      ];
    }
    if (tab === "summary") {
      return [
        {
          id: "md",
          label: "Markdown",
          run: () => exportMeetingMarkdown(meeting),
        },
        {
          id: "pdf",
          label: "PDF",
          run: () => exportMeetingPdf(meeting),
        },
      ];
    }
    if (tab === "audio") {
      return [{ id: "mp3", label: "MP3" }];
    }
    return [{ id: "mp4", label: "MP4" }];
  };

  const formats = formatsForTab();
  const selected = formats.find((f) => f.id === format);

  const download = () => {
    if (!selected?.run) {
      success(`${selected?.label ?? "Format"} — Coming Soon`);
      setOpen(false);
      return;
    }
    try {
      selected.run();
      success(`Exported ${selected.label}.`);
      setOpen(false);
      setFormat(null);
    } catch (e) {
      error(e instanceof Error ? e.message : "Export failed.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "rounded-lg p-1.5 text-ff-gray transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
            : "ff-btn-secondary h-9"
        }
        aria-label="Download meeting"
      >
        <Download className="h-3.5 w-3.5" />
        {compact ? null : "Download"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-meeting-title"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-ff-border bg-ff-bg shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-[var(--ff-border-soft)] px-5 py-4">
              <h2
                id="download-meeting-title"
                className="text-[16px] font-semibold text-ff-text"
              >
                Download Meeting
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-ff-gray-2 transition hover:bg-[var(--ff-input-bg)] hover:text-ff-text"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-0 border-b border-[var(--ff-border-soft)] px-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setFormat(null);
                  }}
                  className={`relative px-3 py-2.5 text-[13px] font-medium transition ${
                    tab === t.key
                      ? "text-ff-text"
                      : "text-ff-gray hover:text-ff-text"
                  }`}
                >
                  {t.label}
                  {tab === t.key ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ff-purple" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="min-h-[100px] px-5 py-5">
              <p className="mb-3 text-[12px] text-ff-gray">
                Choose a format to download.
              </p>
              <div className="flex flex-wrap gap-2">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`rounded-md border px-3 py-1.5 text-[13px] font-medium transition ${
                      format === f.id
                        ? "border-ff-purple bg-ff-soft text-ff-purple"
                        : "border-ff-border bg-ff-bg text-ff-text hover:border-ff-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-[var(--ff-border-soft)] px-5 py-3">
              <button
                type="button"
                onClick={download}
                disabled={!format}
                className={`ff-btn-primary ${!format ? "opacity-50" : ""}`}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
