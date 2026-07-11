"use client";

import type { KeyTopic, Summary } from "@/lib/types";
import { ListTree, Sparkles } from "lucide-react";

type SummaryPanelProps = {
  summary?: Summary | null;
  keyTopics: KeyTopic[];
};

export function SummaryPanel({ summary, keyTopics }: SummaryPanelProps) {
  const topics = [...keyTopics].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
          <h3 className="text-sm font-semibold text-ff-text">Overview</h3>
        </div>
        {summary?.overview_text ? (
          <p className="text-sm leading-relaxed text-ff-gray">
            {summary.overview_text}
          </p>
        ) : (
          <p className="rounded-lg border border-dashed border-ff-border bg-[var(--ff-input-bg)] px-3 py-4 text-sm text-ff-gray">
            Summary will appear here once generated.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ListTree className="h-4 w-4 text-[#6C5CE7]" />
          <h3 className="text-sm font-semibold text-ff-text">
            Key topics / chapters
          </h3>
        </div>
        {topics.length === 0 ? (
          <p className="text-sm text-ff-gray">No topics extracted yet.</p>
        ) : (
          <ol className="space-y-2">
            {topics.map((topic, i) => (
              <li
                key={topic.id}
                className="flex gap-3 rounded-lg border border-[var(--ff-border-soft)] bg-[var(--ff-input-bg)]/80 px-3 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#F3F0FF] text-xs font-semibold text-[#6C5CE7]">
                  {i + 1}
                </span>
                <span className="text-sm text-ff-text">{topic.topic_text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
