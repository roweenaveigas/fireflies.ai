"use client";

import { BarChart3, LineChart, PieChart } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/PageHeader";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-semibold text-ff-text">Analytics</h1>
        <ComingSoonBadge />
      </div>
      <p className="text-sm text-ff-gray">
        Track talk time, topics, and meeting trends across your workspace.
      </p>

      <div className="ff-card px-6 py-14 text-center">
        <div className="mx-auto flex max-w-xs items-end justify-center gap-3">
          <span className="flex h-16 w-10 items-end justify-center rounded-t-lg bg-ff-soft pb-2 text-ff-purple">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="flex h-24 w-10 items-end justify-center rounded-t-lg bg-ff-purple/20 pb-2 text-ff-purple">
            <LineChart className="h-5 w-5" />
          </span>
          <span className="flex h-20 w-10 items-end justify-center rounded-t-lg bg-ff-soft pb-2 text-ff-purple">
            <PieChart className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <ComingSoonBadge />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ff-text">
          Meeting analytics are on the way
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ff-gray">
          Soon you&apos;ll see speaker ratios, topic trends, and engagement
          across meetings. For this assignment, use summaries and action items
          on each meeting instead.
        </p>
        <button
          type="button"
          disabled
          className="ff-btn-primary mt-8 opacity-50"
        >
          <BarChart3 className="h-4 w-4" />
          View Dashboard
        </button>
      </div>
    </div>
  );
}
