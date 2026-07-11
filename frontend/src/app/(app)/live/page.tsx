"use client";

import { Mic, Radio } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/PageHeader";

export default function LiveBotPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-[22px] font-semibold text-ff-text">Live Bot</h1>
        <ComingSoonBadge />
      </div>
      <p className="text-sm text-ff-gray">
        Send Fireflies into Zoom, Google Meet, or Teams to capture meetings in
        real time.
      </p>

      <div className="ff-card px-6 py-14 text-center">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#F3F0FF]" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-[#6C5CE7]/10" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/30">
            <Radio className="h-7 w-7" />
          </span>
          <span className="absolute -right-1 bottom-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-white text-[#6C5CE7] shadow-sm">
            <Mic className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <ComingSoonBadge />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-ff-text">
          Real-time transcription is on the way
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ff-gray">
          Soon you&apos;ll send a Fireflies live bot into Zoom, Meet, or Teams.
          For this assignment, use uploaded or seeded transcripts instead.
        </p>
        <button
          type="button"
          disabled
          className="mt-8 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#6C5CE7]/40 px-5 py-2.5 text-sm font-medium text-white"
        >
          <Radio className="h-4 w-4" />
          Start Live Bot
        </button>
      </div>
    </div>
  );
}
