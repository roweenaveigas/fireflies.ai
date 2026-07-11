"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Home,
  MoreHorizontal,
  Puzzle,
  Settings,
  Sparkles,
  Upload,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { FirefliesLogo } from "@/components/brand/FirefliesLogo";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  soon?: boolean;
};

const railItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home, match: (p) => p === "/home" || p === "/" },
  {
    href: "/meetings",
    label: "Meetings",
    icon: Video,
    match: (p) => p === "/meetings" || p.startsWith("/meetings/"),
  },
  {
    href: "/live",
    label: "Meeting Status",
    icon: Activity,
    match: (p) => p.startsWith("/live"),
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: Puzzle,
    match: (p) => p.startsWith("/integrations"),
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    match: (p) => p.startsWith("/analytics"),
    soon: true,
  },
  {
    href: "/voice-agents",
    label: "Voice Agents",
    icon: Bot,
    match: (p) => p.startsWith("/voice-agents"),
  },
  {
    href: "/ai-apps",
    label: "AI Skills",
    icon: Sparkles,
    match: (p) =>
      p.startsWith("/ai-apps") ||
      p.startsWith("/digest") ||
      p.startsWith("/prep"),
  },
  {
    href: "/meetings",
    label: "Uploads",
    icon: Upload,
    match: () => false,
    soon: true,
  },
];

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  variant?: "desktop" | "mobile";
  /** Icon-only rail (Meetings page layout) */
  collapsed?: boolean;
};

function linkClass(active: boolean, soon?: boolean, collapsed?: boolean) {
  if (collapsed) {
    return `flex h-10 w-10 items-center justify-center rounded-xl transition ${
      active
        ? "bg-[#F3F0FF] text-[#6C5CE7] dark:bg-ff-soft dark:text-ff-purple"
        : "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] dark:hover:bg-[var(--ff-row-hover)]"
    } ${soon ? "opacity-60" : ""}`;
  }
  return `group flex items-center gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px] transition-all duration-150 ${
    active
      ? "bg-[#F3F0FF] font-semibold text-[#6C5CE7] dark:bg-ff-soft dark:text-ff-purple"
      : "font-medium text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827] dark:text-ff-gray dark:hover:bg-[var(--ff-row-hover)] dark:hover:text-ff-text"
  } ${soon ? "opacity-80" : ""}`;
}

function iconClass(active: boolean, collapsed?: boolean) {
  if (collapsed) {
    return `h-[20px] w-[20px] ${active ? "text-[#6C5CE7]" : "text-current"}`;
  }
  return `h-[18px] w-[18px] shrink-0 transition-colors ${
    active
      ? "text-[#6C5CE7] dark:text-ff-purple"
      : "text-[#6B7280] group-hover:text-[#4B5563] dark:text-ff-gray-2"
  }`;
}

function ExpandedNav({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  const groups = [
    railItems.slice(0, 3),
    [railItems[3], railItems[4]],
    [railItems[5], railItems[6]],
  ];

  return (
    <>
      <div className="flex h-[56px] shrink-0 items-center justify-between px-3.5">
        <Link href="/home" onClick={onClose} className="transition hover:opacity-90">
          <FirefliesLogo />
        </Link>
        {onClose ? (
          <button
            type="button"
            className="rounded-md p-1.5 text-ff-gray-2 transition hover:bg-[var(--ff-input-bg)] lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col px-2 pb-2">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 ? (
              <div className="my-2.5 border-t border-[#E5E7EB] dark:border-[var(--ff-border-soft)]" />
            ) : null}
            <div className="space-y-0.5">
              {group.map((item) => {
                const Icon = item.icon;
                const active = !item.soon && item.match(pathname);
                if (item.soon) {
                  return (
                    <div
                      key={item.label}
                      className={linkClass(false, true)}
                      title="Coming soon"
                    >
                      <Icon className={iconClass(false)} strokeWidth={1.75} />
                      <span className="flex-1 truncate">{item.label}</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={linkClass(active)}
                  >
                    <Icon className={iconClass(active)} strokeWidth={1.75} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex-1" />
        <div className="my-2 border-t border-[#E5E7EB] dark:border-[var(--ff-border-soft)]" />
        <div className="shrink-0 space-y-0.5 pb-1">
          <Link
            href="/settings"
            onClick={onClose}
            className={linkClass(settingsActive)}
          >
            <Settings className={iconClass(settingsActive)} strokeWidth={1.75} />
            <span className="flex-1 truncate">Settings</span>
          </Link>
          <button type="button" className={linkClass(false)}>
            <MoreHorizontal className={iconClass(false)} strokeWidth={1.75} />
            <span className="flex-1 truncate text-left">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function CollapsedRail() {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  const top = [
    railItems[0],
    railItems[1],
    railItems[2],
    railItems[3],
    railItems[4],
    railItems[5],
    railItems[6],
  ];

  return (
    <>
      <div className="flex h-[56px] shrink-0 items-center justify-center">
        <Link
          href="/home"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#EC4899] to-[#8B5CF6] text-sm font-bold text-white shadow-sm"
          title="fireflies.ai"
        >
          F
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 px-1.5 pb-2">
        {top.map((item) => {
          const Icon = item.icon;
          const active = !item.soon && item.match(pathname);
          if (item.soon) {
            return (
              <div
                key={item.label}
                className={linkClass(false, true, true)}
                title={`${item.label} — Coming soon`}
              >
                <Icon className={iconClass(false, true)} strokeWidth={1.75} />
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className={linkClass(active, false, true)}
              title={item.label}
            >
              <Icon className={iconClass(active, true)} strokeWidth={1.75} />
            </Link>
          );
        })}

        <div className="flex-1" />

        <Link
          href="/settings"
          className={linkClass(settingsActive, false, true)}
          title="Settings"
        >
          <Settings className={iconClass(settingsActive, true)} strokeWidth={1.75} />
        </Link>
        <button
          type="button"
          className={linkClass(false, false, true)}
          title="More"
        >
          <MoreHorizontal className={iconClass(false, true)} strokeWidth={1.75} />
        </button>
      </nav>
    </>
  );
}

export function Sidebar({
  open = false,
  onClose,
  variant = "desktop",
  collapsed = false,
}: SidebarProps) {
  if (variant === "mobile") {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-200 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={onClose}
          aria-hidden={!open}
        />
        <aside
          className={`fixed bottom-0 left-0 top-8 z-50 flex w-[220px] flex-col border-r border-[#E5E7EB] bg-white transition-transform duration-200 ease-out dark:border-ff-border dark:bg-ff-sidebar ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ExpandedNav onClose={onClose} />
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`flex h-full w-full flex-col border-r border-[#E5E7EB] bg-[#FAFAFB] dark:border-ff-border dark:bg-ff-sidebar ${
        collapsed ? "" : "bg-white dark:bg-ff-sidebar"
      }`}
    >
      {collapsed ? <CollapsedRail /> : <ExpandedNav onClose={onClose} />}
    </aside>
  );
}
