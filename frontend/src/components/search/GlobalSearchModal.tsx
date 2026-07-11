"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ListTodo,
  Loader2,
  Search,
  Tag,
  Type,
  User,
  X,
} from "lucide-react";
import { globalSearch } from "@/lib/annotations";
import type { SearchSnippet } from "@/lib/types";

const GROUP_ORDER = [
  "title",
  "transcript",
  "participant",
  "summary",
  "action_item",
  "tag",
] as const;

const GROUP_LABELS: Record<string, string> = {
  title: "Meetings",
  transcript: "Transcript",
  participant: "People",
  summary: "Summaries",
  action_item: "Action items",
  tag: "Tags",
};

const GROUP_ICONS: Record<string, typeof Search> = {
  title: Type,
  transcript: FileText,
  participant: User,
  summary: FileText,
  action_item: ListTodo,
  tag: Tag,
};

type GlobalSearchModalProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

export function GlobalSearchModal({
  open,
  onClose,
  initialQuery = "",
}: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [results, setResults] = useState<SearchSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setDebounced(initialQuery.trim());
    }
  }, [open, initialQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setResults([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    globalSearch(debounced)
      .then((data) => {
        if (!cancelled) setResults(data.results);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setError("Search failed. Is the API running?");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchSnippet[]>();
    for (const r of results) {
      const list = map.get(r.match_type) ?? [];
      list.push(r);
      map.set(r.match_type, list);
    }
    return GROUP_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      items: map.get(k)!,
    }));
  }, [results]);

  if (!open) return null;

  const go = (r: SearchSnippet) => {
    onClose();
    const params = new URLSearchParams();
    if (r.line_id) params.set("line", String(r.line_id));
    if (r.start_time_seconds != null)
      params.set("t", String(r.start_time_seconds));
    const qs = params.toString();
    router.push(`/meetings/${r.meeting_id}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ff-border bg-ff-bg shadow-2xl">
        <div className="flex items-center gap-2 border-b border-ff-border px-4 py-3">
          <Search className="h-4 w-4 text-ff-gray-2" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meetings, transcripts, people, actions…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ff-text outline-none placeholder:text-ff-gray-2"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ff-gray-2 hover:bg-ff-soft hover:text-ff-purple"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-ff-gray">
              <Loader2 className="h-4 w-4 animate-spin text-ff-purple" />
              Searching…
            </div>
          ) : null}
          {error ? (
            <p className="px-3 py-8 text-center text-sm text-red-500">{error}</p>
          ) : null}
          {!loading && !error && debounced && results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-ff-gray">
              No results for “{debounced}”
            </p>
          ) : null}
          {!debounced && !loading ? (
            <p className="px-3 py-8 text-center text-sm text-ff-gray">
              Search across titles, transcripts, people, summaries, and tasks.
            </p>
          ) : null}

          {grouped.map((group) => {
            const Icon = GROUP_ICONS[group.key] ?? Search;
            return (
              <div key={group.key} className="mb-3">
                <p className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
                  <Icon className="h-3 w-3" />
                  {GROUP_LABELS[group.key] ?? group.key}
                </p>
                <ul>
                  {group.items.slice(0, 8).map((r, i) => (
                    <li key={`${r.match_type}-${r.meeting_id}-${r.line_id ?? i}`}>
                      <button
                        type="button"
                        onClick={() => go(r)}
                        className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition hover:bg-ff-soft"
                      >
                        <span className="truncate text-sm font-semibold text-ff-text">
                          {r.meeting_title}
                        </span>
                        <span className="line-clamp-2 text-xs text-ff-gray">
                          {r.snippet}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
