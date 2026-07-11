"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { ActionItem } from "@/lib/types";
import {
  createActionItem,
  deleteActionItem,
  updateActionItem,
} from "@/lib/meetings";
import { formatClock } from "@/lib/format";
import { useToast } from "@/components/ui/ToastProvider";

type ActionItemsPanelProps = {
  meetingId: number;
  items: ActionItem[];
  onChange: (items: ActionItem[]) => void;
  onTimestampClick?: (seconds: number) => void;
  compact?: boolean;
};

function mockTimestampSeconds(itemId: number): number {
  return (itemId * 17) % 600;
}

export function ActionItemsPanel({
  meetingId,
  items,
  onChange,
  onTimestampClick,
  compact = false,
}: ActionItemsPanelProps) {
  const { success, error: toastError } = useToast();
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [busyId, setBusyId] = useState<number | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editAssignee, setEditAssignee] = useState("");

  const sorted = [...items].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return a.id - b.id;
  });

  const grouped = sorted.reduce<{ assignee: string; items: ActionItem[] }[]>(
    (acc, item) => {
      const key = item.assignee?.trim() || "Unassigned";
      const existing = acc.find((g) => g.assignee === key);
      if (existing) existing.items.push(item);
      else acc.push({ assignee: key, items: [item] });
      return acc;
    },
    []
  );

  const startEdit = (item: ActionItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditAssignee(item.assignee ?? "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditAssignee("");
  };

  const saveEdit = async (item: ActionItem) => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setError("Action text is required.");
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      const updated = await updateActionItem(meetingId, item.id, {
        text: trimmed,
        assignee: editAssignee.trim() || null,
      });
      onChange(items.map((i) => (i.id === item.id ? updated : i)));
      success("Action item updated.");
      cancelEdit();
    } catch {
      setError("Could not update action item.");
      toastError("Could not update action item.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleComplete = async (item: ActionItem) => {
    setBusyId(item.id);
    setError(null);
    try {
      const updated = await updateActionItem(meetingId, item.id, {
        is_completed: !item.is_completed,
      });
      onChange(items.map((i) => (i.id === item.id ? updated : i)));
      success(
        updated.is_completed ? "Action item completed." : "Action item reopened."
      );
    } catch {
      setError("Could not update action item.");
      toastError("Could not update action item.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: ActionItem) => {
    setBusyId(item.id);
    setError(null);
    try {
      await deleteActionItem(meetingId, item.id);
      onChange(items.filter((i) => i.id !== item.id));
      success("Action item deleted.");
      if (editingId === item.id) cancelEdit();
    } catch {
      setError("Could not delete action item.");
      toastError("Could not delete action item.");
    } finally {
      setBusyId(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setBusyId("new");
    setError(null);
    try {
      const created = await createActionItem(meetingId, {
        text: trimmed,
        assignee: assignee.trim() || null,
        is_completed: false,
      });
      onChange([...items, created]);
      setText("");
      setAssignee("");
      success("Action item added.");
    } catch {
      setError("Could not add action item.");
      toastError("Could not add action item.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <ul className={compact ? "space-y-3" : "space-y-4"}>
        {sorted.length === 0 ? (
          <li className="rounded-lg border border-dashed border-ff-border bg-[var(--ff-input-bg)] px-3 py-6 text-center text-sm text-ff-gray">
            No action items yet.
          </li>
        ) : (
          grouped.map((group) => (
            <li key={group.assignee} className="space-y-1.5">
              <p className="text-[13px] font-bold text-ff-text">
                {group.assignee}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const seconds = mockTimestampSeconds(item.id);
                  const clock = formatClock(seconds);

                  if (editingId === item.id) {
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-[var(--ff-border-soft)] bg-[var(--ff-input-bg)]/60 px-3 py-2.5"
                      >
                        <div className="space-y-2">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="ff-input"
                            placeholder="Action text"
                            autoFocus
                          />
                          <input
                            value={editAssignee}
                            onChange={(e) => setEditAssignee(e.target.value)}
                            className="ff-input"
                            placeholder="Assignee (optional)"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={busyId === item.id}
                              className="ff-btn-secondary h-8 px-2.5 text-xs"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveEdit(item)}
                              disabled={busyId === item.id}
                              className="ff-btn-primary h-8 px-2.5 text-xs"
                            >
                              {busyId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Save
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={item.id}
                      className={`group flex items-start gap-2 py-0.5 ${
                        compact ? "" : "rounded-lg px-1"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        disabled={busyId === item.id}
                        onChange={() => void toggleComplete(item)}
                        className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-ff-border text-[#6C5CE7] opacity-60 transition focus:ring-[#6C5CE7]/30 group-hover:opacity-100"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            item.is_completed
                              ? "text-ff-gray-2 line-through"
                              : "text-ff-text"
                          }`}
                        >
                          <span className="mr-1 text-ff-gray-2">•</span>
                          {item.text}{" "}
                          {onTimestampClick ? (
                            <button
                              type="button"
                              onClick={() => onTimestampClick(seconds)}
                              className="text-[#3B82F6] hover:underline"
                            >
                              ({clock})
                            </button>
                          ) : (
                            <span className="text-[#3B82F6]">({clock})</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={busyId === item.id}
                          className="rounded-md p-1 text-ff-gray-2 transition hover:bg-[#F3F0FF] hover:text-[#6C5CE7]"
                          aria-label="Edit action item"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(item)}
                          disabled={busyId === item.id}
                          className="rounded-md p-1 text-ff-gray-2 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          aria-label="Delete action item"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))
        )}
      </ul>

      <form
        onSubmit={onSubmit}
        className="space-y-2 border-t border-[var(--ff-border-soft)] pt-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ff-gray-2">
          Add action item
        </p>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="ff-input"
        />
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Assignee (optional)"
          className="ff-input"
        />
        <button
          type="submit"
          disabled={busyId === "new" || !text.trim()}
          className="ff-btn-primary w-full"
        >
          {busyId === "new" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add item
        </button>
      </form>
    </div>
  );
}
