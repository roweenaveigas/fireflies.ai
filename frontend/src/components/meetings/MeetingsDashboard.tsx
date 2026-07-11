"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search } from "lucide-react";
import { MeetingRow } from "@/components/meetings/MeetingRow";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";
import { dateInputToIsoEnd, dateInputToIsoStart } from "@/lib/format";
import { fetchTags } from "@/lib/annotations";
import { fetchMeetings } from "@/lib/meetings";
import type { MeetingListItem, Participant, Tag } from "@/lib/types";

const DEBOUNCE_MS = 300;

function ListSkeleton() {
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6">
      {[1, 2].map((g) => (
        <div key={g}>
          <div className="ff-skeleton mb-2 h-3 w-24" />
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-ff-border dark:bg-ff-bg">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-[var(--ff-border-soft)] px-4 py-3.5 last:border-b-0"
              >
                <div className="ff-skeleton h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="ff-skeleton h-3.5 w-2/3" />
                  <div className="ff-skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MeetingsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const listView = searchParams.get("view") ?? "my";

  const [search, setSearch] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ.trim());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<"recency" | "oldest">("recency");
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(
    null
  );
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [scope, setScope] = useState<"hosted" | "shared">("hosted");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch(q);
    setDebouncedSearch(q.trim());
  }, [searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedSearch === current.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedSearch, pathname, router, searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeetings({
        q: debouncedSearch || undefined,
        date_from: dateInputToIsoStart(dateFrom),
        date_to: dateInputToIsoEnd(dateTo),
        sort,
        tag: selectedTag || undefined,
      });
      setMeetings(data.meetings);

      const map = new Map<number, Participant>();
      for (const m of data.meetings) {
        for (const p of m.participants) map.set(p.id, p);
      }
      setAllParticipants((prev) => {
        const next = new Map(prev.map((p) => [p.id, p]));
        Array.from(map.entries()).forEach(([id, p]) => next.set(id, p));
        return Array.from(next.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
    } catch {
      setError("Could not load meetings. Is the API running on localhost:8000?");
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, dateFrom, dateTo, sort, selectedTag]);

  useEffect(() => {
    void fetchMeetings({ sort: "recency" })
      .then((data) => {
        const map = new Map<number, Participant>();
        for (const m of data.meetings) {
          for (const p of m.participants) map.set(p.id, p);
        }
        setAllParticipants(
          Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => undefined);
    void fetchTags()
      .then(setAllTags)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMeetings = useMemo(() => {
    let list = meetings;

    if (listView === "voice") {
      list = list.filter(
        (m) =>
          m.tags?.some((t) => /voice/i.test(t.name)) ||
          /voice|agent/i.test(m.title)
      );
    }

    if (selectedParticipantId != null) {
      list = list.filter((m) =>
        m.participants.some((p) => p.id === selectedParticipantId)
      );
    }

    if (scope === "shared") {
      list = list.filter((m) => m.participants.length >= 3);
    } else if (listView === "my" || scope === "hosted") {
      // "My Meetings" / Hosted by me — show all seeded meetings as yours
      // (demo has no host field; keep full list)
    }

    return list;
  }, [meetings, selectedParticipantId, scope, listView]);

  const groupedByDate = useMemo(() => {
    const groups: { label: string; items: MeetingListItem[] }[] = [];
    const map = new Map<string, MeetingListItem[]>();
    for (const m of filteredMeetings) {
      const d = new Date(m.date);
      const label = Number.isNaN(d.getTime())
        ? "Unknown date"
        : d.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
          });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(m);
    }
    for (const [label, items] of Array.from(map.entries())) {
      groups.push({ label, items });
    }
    return groups;
  }, [filteredMeetings]);

  const viewTitle =
    listView === "all"
      ? "All Meetings"
      : listView === "voice"
        ? "Voice Agent Meetings"
        : "Meetings";

  return (
    <div className="flex min-h-[calc(100vh-7.5rem)] flex-col bg-[#FAFAFB] dark:bg-canvas">
      <div className="sticky top-[calc(2rem+56px)] z-10 border-b border-[#E5E7EB] bg-white px-4 py-3 dark:border-ff-border dark:bg-ff-bg sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-[18px] font-semibold text-ff-text">{viewTitle}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-[260px] sm:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ff-gray-2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or keyword"
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-1.5 pl-8 pr-3 text-[12px] text-ff-text outline-none placeholder:text-ff-gray-2 focus:border-ff-purple/40 focus:ring-2 focus:ring-ff-purple/10 dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
              />
            </div>
            {(
              [
                { id: "hosted" as const, label: "Hosted by me" },
                { id: "shared" as const, label: "Shared with me" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                  scope === tab.id
                    ? "border-[#D1D5DB] bg-white text-ff-text shadow-sm dark:border-ff-border dark:bg-ff-bg"
                    : "border-transparent text-ff-gray hover:bg-[#F3F4F6] dark:hover:bg-[var(--ff-row-hover)]"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition ${
                filtersOpen
                  ? "border-ff-purple/40 bg-ff-soft text-ff-purple"
                  : "border-[#E5E7EB] bg-white text-ff-gray hover:border-ff-muted dark:border-ff-border dark:bg-ff-bg"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-ff-border dark:bg-[var(--ff-input-bg)]">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-ff-gray">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="ff-input h-9 py-1 text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-ff-gray">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="ff-input h-9 py-1 text-xs"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-ff-gray">Tag</span>
              <select
                value={selectedTag ?? ""}
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="ff-input h-9 py-1 text-xs"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t.id} value={t.name}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-ff-gray">
                Participant
              </span>
              <select
                value={selectedParticipantId ?? ""}
                onChange={(e) =>
                  setSelectedParticipantId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="ff-input h-9 py-1 text-xs"
              >
                <option value="">Anyone</option>
                {allParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() =>
                setSort((s) => (s === "recency" ? "oldest" : "recency"))
              }
              className="ff-btn-secondary h-9 text-xs"
            >
              {sort === "recency" ? "Newest first" : "Oldest first"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSelectedTag(null);
                setSelectedParticipantId(null);
              }}
              className="h-9 text-xs font-semibold text-ff-purple hover:underline"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex-1 px-4 py-4 sm:px-6">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <ListSkeleton />
        ) : filteredMeetings.length === 0 ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-16 text-center dark:border-ff-border dark:bg-ff-bg">
            <p className="text-base font-semibold text-ff-text">
              {listView === "voice"
                ? "No voice agent meetings"
                : "No meetings found"}
            </p>
            <p className="mt-1 text-sm text-ff-gray">
              {listView === "voice"
                ? "Voice agent recordings will appear here."
                : "Try a different search, clear filters, or create a new meeting."}
            </p>
            {listView !== "voice" ? (
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="ff-btn-primary mt-4"
              >
                New Meeting
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {groupedByDate.map((group) => (
              <div key={group.label}>
                <h2 className="mb-2 px-1 text-[13px] font-semibold text-ff-gray">
                  {group.label}
                </h2>
                <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white dark:border-ff-border dark:bg-ff-bg">
                  <ul>
                    {group.items.map((meeting) => (
                      <li key={meeting.id}>
                        <MeetingRow
                          meeting={meeting}
                          onChanged={() => void load()}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewMeetingModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}
