"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { FirefliesLogo } from "@/components/brand/FirefliesLogo";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MeetingsNavPanel } from "@/components/meetings/MeetingsNavPanel";
import { AiAppsNavPanel } from "@/components/ai-apps/AiAppsNavPanel";
import { NewMeetingModal } from "@/components/meetings/NewMeetingModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const pathname = usePathname();
  const isDetail = pathname.startsWith("/meetings/") && pathname !== "/meetings";
  const isMeetingsList = pathname === "/meetings";
  const isAiAppsSection =
    pathname.startsWith("/ai-apps") ||
    pathname.startsWith("/digest") ||
    pathname.startsWith("/prep");
  const collapseRail = isMeetingsList || isDetail || isAiAppsSection;
  const isWide =
    pathname === "/home" ||
    pathname.startsWith("/voice-agents") ||
    isAiAppsSection ||
    isMeetingsList ||
    isDetail;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const railWidth = collapseRail ? "w-[56px]" : "w-[220px]";

  return (
    <div className="flex min-h-screen bg-canvas text-ff-text">
      {!isDetail ? (
        <div className="fixed inset-x-0 top-0 z-[60] flex h-8 items-center justify-center bg-[#FFF8E1] px-3 text-center text-[12px] font-medium text-[#92400E] dark:bg-amber-950 dark:text-amber-200">
          <span className="truncate">
            ✨ Invite your team — FREE for 1 month{" "}
            <button type="button" className="font-semibold underline">
              Invite Now →
            </button>
          </span>
        </div>
      ) : null}

      <div className={`flex min-h-screen w-full ${isDetail ? "" : "pt-8"}`}>
        {/* Desktop primary nav */}
        <div
          className={`sticky z-50 hidden h-screen shrink-0 transition-[width] duration-200 lg:block ${
            isDetail ? "top-0 h-screen" : "top-8 h-[calc(100vh-2rem)]"
          } ${railWidth}`}
        >
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            variant="desktop"
            collapsed={collapseRail}
          />
        </div>

        {isMeetingsList ? (
          <div className="sticky top-8 z-40 hidden h-[calc(100vh-2rem)] shrink-0 lg:block">
            <Suspense
              fallback={
                <div className="h-full w-[240px] border-r border-ff-border bg-white" />
              }
            >
              <MeetingsNavPanel />
            </Suspense>
          </div>
        ) : null}

        {/* AI Apps secondary nav for hub + Daily Digest */}
        {pathname.startsWith("/ai-apps") || pathname.startsWith("/digest") ? (
          <div className="sticky top-8 z-40 hidden h-[calc(100vh-2rem)] shrink-0 lg:block">
            <AiAppsNavPanel />
          </div>
        ) : null}

        <div className="lg:hidden">
          <Sidebar open={open} onClose={() => setOpen(false)} variant="mobile" />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col ${
            isDetail ? "min-h-screen" : "min-h-[calc(100vh-2rem)]"
          }`}
        >
          {!isDetail ? (
            <div className="sticky top-8 z-30 flex h-12 items-center gap-3 border-b border-ff-border bg-ff-bg px-3 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg p-2 text-ff-gray hover:bg-[var(--ff-row-hover)]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <FirefliesLogo />
            </div>
          ) : null}

          {!isDetail ? <TopBar onNewMeeting={() => setNewOpen(true)} /> : null}

          {isMeetingsList ? (
            <div className="border-b border-ff-border bg-white px-3 py-2 lg:hidden dark:bg-ff-bg">
              <Suspense fallback={null}>
                <div className="flex gap-2 overflow-x-auto">
                  {(
                    [
                      { id: "my", label: "My Meetings", href: "/meetings?view=my" },
                      { id: "all", label: "All Meetings", href: "/meetings?view=all" },
                      {
                        id: "voice",
                        label: "Voice Agents",
                        href: "/meetings?view=voice",
                      },
                    ] as const
                  ).map((t) => (
                    <a
                      key={t.id}
                      href={t.href}
                      className="shrink-0 rounded-full border border-ff-border px-3 py-1.5 text-[12px] font-semibold text-ff-gray"
                    >
                      {t.label}
                    </a>
                  ))}
                </div>
              </Suspense>
            </div>
          ) : null}

          <main
            className={`flex-1 ${
              isDetail || isMeetingsList || isAiAppsSection
                ? "px-0 py-0"
                : "px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5"
            }`}
          >
            <div
              className={`mx-auto w-full ${
                isWide || isDetail ? "max-w-none" : "max-w-[1180px]"
              } ${isMeetingsList || isDetail || isAiAppsSection ? "h-full" : ""}`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <NewMeetingModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
