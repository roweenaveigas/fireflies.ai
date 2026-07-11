"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { updateMeeting } from "@/lib/meetings";
import type { MeetingDetail, Tag as TagType } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

type MeetingTagsEditorProps = {
  meeting: MeetingDetail;
  onSaved: (meeting: MeetingDetail) => void;
};

export function MeetingTagsEditor({ meeting, onSaved }: MeetingTagsEditorProps) {
  const { success, error } = useToast();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const tags = meeting.tags ?? [];

  const persist = async (names: string[]) => {
    setBusy(true);
    try {
      const updated = await updateMeeting(meeting.id, { tag_names: names });
      onSaved(updated);
      success("Tags updated.");
    } catch {
      error("Could not update tags.");
    } finally {
      setBusy(false);
    }
  };

  const add = async (e?: FormEvent) => {
    e?.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    setDraft("");
    await persist([...tags.map((t) => t.name), name]);
  };

  const remove = async (tag: TagType) => {
    await persist(tags.filter((t) => t.id !== tag.id).map((t) => t.name));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void add();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag className="h-3.5 w-3.5 text-ff-purple" />
      {tags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 rounded-full bg-ff-soft px-2.5 py-1 text-[11px] font-semibold text-ff-purple"
        >
          {t.name}
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove(t)}
            className="rounded-full p-0.5 hover:bg-white/50"
            aria-label={`Remove ${t.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <form onSubmit={(e) => void add(e)} className="inline-flex items-center gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Add tag…"
          disabled={busy}
          className="w-28 rounded-full border border-dashed border-ff-border bg-transparent px-2.5 py-1 text-[11px] text-ff-text outline-none placeholder:text-ff-gray-2 focus:border-ff-purple"
        />
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-ff-purple" /> : null}
      </form>
    </div>
  );
}
