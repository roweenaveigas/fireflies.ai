"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Newspaper,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
} from "lucide-react";

const recentApps = [
  {
    href: "/digest",
    title: "Popular Topics",
    color: "bg-[#FBBF24]",
    match: () => false,
  },
  {
    href: "/digest",
    title: "Daily Digest",
    color: "bg-[#67E8F9]",
    match: (p: string) => p.startsWith("/digest"),
  },
  {
    href: "/prep",
    title: "Meeting Prep",
    color: "bg-[#F9A8D4]",
    match: (p: string) => p.startsWith("/prep"),
  },
];

export function AiAppsNavPanel() {
  const pathname = usePathname();

  const nav = [
    {
      href: "/ai-apps",
      label: "Feed",
      icon: Star,
      active: pathname === "/ai-apps",
    },
    {
      href: "/ai-apps?tab=manage",
      label: "Manage Apps",
      icon: Settings2,
      active: false,
    },
    {
      href: "/ai-apps?tab=discover",
      label: "Discover",
      icon: Compass,
      active: pathname === "/ai-apps",
    },
  ];

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white dark:border-ff-border dark:bg-ff-sidebar">
      <div className="border-b border-[#E5E7EB] px-4 py-3 dark:border-[var(--ff-border-soft)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
          <h2 className="text-[14px] font-semibold text-ff-text">AI Apps</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                  item.active && item.label === "Feed"
                    ? "bg-[#F3F0FF] text-[#6C5CE7]"
                    : "text-[#4B5563] hover:bg-[#F9FAFB] dark:text-ff-gray dark:hover:bg-[var(--ff-row-hover)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 px-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ff-gray-2" />
            <input
              type="search"
              placeholder="Search Apps"
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-8 pr-3 text-[12px] outline-none placeholder:text-ff-gray-2 focus:border-[#6C5CE7]/40 dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
            />
          </div>
        </div>

        <div className="mt-5 px-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
            Recent (3)
          </p>
          <ul className="space-y-0.5">
            {recentApps.map((app, i) => {
              const active = app.match(pathname);
              return (
                <li key={`${app.title}-${i}`}>
                  <Link
                    href={app.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] transition ${
                      active
                        ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7]"
                        : "font-medium text-[#4B5563] hover:bg-[#F9FAFB] dark:text-ff-gray"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded ${app.color} text-white`}
                    >
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="truncate">{app.title}</span>
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F472B6]" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 px-2">
          <Link
            href="/digest"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
          >
            <Newspaper className="h-4 w-4 text-[#6C5CE7]" />
            Daily Digest
          </Link>
          <Link
            href="/prep"
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium text-[#4B5563] hover:bg-[#F9FAFB]"
          >
            <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
            Meeting Prep
          </Link>
        </div>
      </div>
    </aside>
  );
}
