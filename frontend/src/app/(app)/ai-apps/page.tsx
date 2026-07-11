"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Compass,
  Newspaper,
  Settings2,
  Star,
} from "lucide-react";

type HubTab = "feed" | "manage" | "discover";

const apps = [
  {
    href: "/digest",
    title: "Daily Digest",
    description:
      "A productivity brief of action items, FYIs, blockers, and open questions from your meetings.",
    icon: Newspaper,
    tag: "PRODUCTIVITY",
    accent: "bg-[#67E8F9]",
  },
  {
    href: "/prep",
    title: "Meeting Prep",
    description:
      "Prep for upcoming meetings with notes from past syncs, action items & company insights.",
    icon: CalendarCheck,
    tag: "PRODUCTIVITY",
    accent: "bg-[#F9A8D4]",
  },
];

export default function AiAppsPage() {
  const [tab, setTab] = useState<HubTab>("discover");

  return (
    <div className="min-h-[calc(100vh-7.5rem)] bg-white dark:bg-ff-bg">
      <div className="border-b border-[#E5E7EB] px-5 py-3 dark:border-ff-border sm:px-8">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-ff-gray">
          <Link href="/home" className="hover:text-[#6C5CE7]">
            Home
          </Link>
          <span>/</span>
          <span className="font-medium text-ff-text">AI Apps</span>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] space-y-6 px-5 py-6 sm:px-8">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-ff-text">
            AI Apps
          </h1>
          <p className="mt-1 text-sm text-ff-gray">
            Apps that turn meeting intelligence into daily action — under Home.
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1 w-fit dark:border-ff-border dark:bg-[var(--ff-input-bg)]">
          {(
            [
              { key: "feed" as const, label: "Feed", icon: Star },
              { key: "manage" as const, label: "Manage Apps", icon: Settings2 },
              { key: "discover" as const, label: "Discover", icon: Compass },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition ${
                tab === key
                  ? "bg-white text-ff-text shadow-sm dark:bg-ff-bg"
                  : "text-ff-gray hover:text-ff-text"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === "feed" ? (
          <div className="rounded-xl border border-[#E5E7EB] px-6 py-14 text-center dark:border-ff-border">
            <Newspaper className="mx-auto h-10 w-10 text-[#6C5CE7]" />
            <h2 className="mt-4 text-lg font-semibold text-ff-text">
              Your feed is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ff-gray">
              Open Daily Digest or Meeting Prep from Discover to get started.
            </p>
            <button
              type="button"
              onClick={() => setTab("discover")}
              className="ff-btn-primary mt-4"
            >
              Discover apps
            </button>
          </div>
        ) : null}

        {tab === "manage" ? (
          <div className="rounded-xl border border-[#E5E7EB] px-6 py-14 text-center dark:border-ff-border">
            <Settings2 className="mx-auto h-10 w-10 text-[#6C5CE7]" />
            <h2 className="mt-4 text-lg font-semibold text-ff-text">
              Manage Apps
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ff-gray">
              App settings and schedules will appear here.
            </p>
          </div>
        ) : null}

        {tab === "discover" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.href}
                  href={app.href}
                  className="group rounded-xl border border-[#E5E7EB] bg-white p-5 transition hover:border-[#6C5CE7]/40 hover:shadow-md dark:border-ff-border dark:bg-ff-bg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${app.accent} text-white`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-ff-gray-2">
                      {app.tag}
                    </span>
                  </div>
                  <h2 className="mt-4 text-[16px] font-semibold text-ff-text group-hover:text-[#6C5CE7]">
                    {app.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ff-gray">
                    {app.description}
                  </p>
                  <span className="mt-4 inline-block text-sm font-semibold text-[#6C5CE7]">
                    Open →
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
