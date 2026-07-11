"use client";

import { Suspense } from "react";
import { MeetingDetailView } from "@/components/meetings/MeetingDetailView";

function InvalidId() {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
      Invalid meeting id.
    </div>
  );
}

export default function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meetingId = Number(params.id);
  if (!Number.isFinite(meetingId) || meetingId <= 0) {
    return <InvalidId />;
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="ff-skeleton h-8 w-2/3 max-w-md" />
          <div className="ff-skeleton h-96 w-full rounded-xl" />
        </div>
      }
    >
      <MeetingDetailView meetingId={meetingId} />
    </Suspense>
  );
}
