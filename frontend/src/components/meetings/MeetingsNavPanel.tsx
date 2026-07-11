"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bot,
  Hash,
  Inbox,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export type MeetingsView = "my" | "all" | "voice";

type MeetingsNavPanelProps = {
  view?: MeetingsView;
  onViewChange?: (view: MeetingsView) => void;
};

export function MeetingsNavPanel({
  view: controlledView,
  onViewChange,
}: MeetingsNavPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { success } = useToast();

  const urlView = (searchParams.get("view") as MeetingsView | null) ?? "my";
  const view = controlledView ?? urlView;

  const items: {
    id: MeetingsView;
    label: string;
    icon: LucideIcon;
    href: string;
  }[] = [
    {
      id: "my",
      label: "My Meetings",
      icon: Hash,
      href: "/meetings?view=my",
    },
    {
      id: "all",
      label: "All Meetings",
      icon: Inbox,
      href: "/meetings?view=all",
    },
    {
      id: "voice",
      label: "Voice Agent Meetings",
      icon: Bot,
      href: "/meetings?view=voice",
    },
  ];

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#E5E7EB] bg-white dark:border-ff-border dark:bg-ff-sidebar">
      <div className="border-b border-[#E5E7EB] p-3 dark:border-[var(--ff-border-soft)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ff-gray-2" />
          <input
            type="search"
            placeholder="Search channels"
            className="w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-8 pr-3 text-[12px] text-ff-text outline-none placeholder:text-ff-gray-2 focus:border-ff-purple/40 focus:ring-2 focus:ring-ff-purple/10 dark:border-ff-border dark:bg-[var(--ff-input-bg)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
          Meetings
        </p>
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === "/meetings" &&
              (view === item.id || (item.id === "my" && !searchParams.get("view")));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onViewChange?.(item.id)}
                className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                  active
                    ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7] dark:bg-ff-soft dark:text-ff-purple"
                    : "font-medium text-[#4B5563] hover:bg-[#F9FAFB] dark:text-ff-gray dark:hover:bg-[var(--ff-row-hover)]"
                }`}
              >
                {active ? (
                  <span className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-full bg-[#6C5CE7]" />
                ) : null}
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    active ? "text-[#6C5CE7]" : "text-[#6B7280]"
                  }`}
                  strokeWidth={1.75}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="my-4 border-t border-[#E5E7EB] dark:border-[var(--ff-border-soft)]" />

        <div className="px-2">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ff-gray-2">
            All channels
          </p>
          <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFB] px-3 py-4 text-center dark:border-ff-border dark:bg-[var(--ff-input-bg)]">
            <Hash className="mx-auto h-5 w-5 text-ff-gray-2" />
            <p className="mt-2 text-[12px] leading-snug text-ff-gray">
              Create channels to organize your conversations
            </p>
            <button
              type="button"
              onClick={() => success("Channels — Coming Soon")}
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#6C5CE7] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Channel
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
