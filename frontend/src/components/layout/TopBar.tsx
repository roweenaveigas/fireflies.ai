"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Calendar,
  Camera,
  ChevronDown,
  CircleHelp,
  LogOut,
  Mic,
  Search,
  Settings,
  Upload,
  User,
  UserPlus,
  Video,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/ProfileProvider";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { useToast } from "@/components/ui/ToastProvider";

const titles: Record<string, string> = {
  "/home": "Home",
  "/meetings": "Meetings",
  "/live": "Meeting Status",
  "/integrations": "Integrations",
  "/voice-agents": "Voice Agents",
  "/ai-apps": "AI Apps",
  "/digest": "Daily Digest",
  "/prep": "Meeting Prep",
  "/team": "Team",
  "/settings": "Settings",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/meetings/")) return "Meeting";
  if (pathname.startsWith("/digest")) return "Home / AI Apps / Daily Digest";
  if (pathname.startsWith("/prep")) return "Home / AI Apps / Meeting Prep";
  if (pathname.startsWith("/ai-apps")) return "Home / AI Apps";
  return titles[pathname] ?? "Fireflies";
}

type TopBarProps = {
  onNewMeeting?: () => void;
};

export function TopBar({ onNewMeeting }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();
  const { profile, initials } = useProfile();
  const { logout } = useAuth();
  const title = pageTitle(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setMenuOpen(false);
        setCaptureOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen && !captureOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (captureRef.current && !captureRef.current.contains(e.target as Node)) {
        setCaptureOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, captureOpen]);

  const soon = (label: string) => {
    setCaptureOpen(false);
    success(`${label} — Coming Soon`);
  };

  return (
    <>
      <header className="sticky top-8 z-20 border-b border-ff-border bg-ff-bg/95 backdrop-blur-sm">
        <div className="flex h-[56px] items-center gap-3 px-4 lg:px-6">
          <h1 className="hidden shrink-0 text-[15px] font-semibold text-ff-text sm:block">
            {title}
          </h1>

          <div className="mx-auto flex w-full max-w-xl flex-1 items-center">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative flex w-full items-center rounded-lg border border-ff-border bg-[var(--ff-input-bg)] py-2 pl-9 pr-16 text-left text-sm text-ff-gray-2 transition hover:border-ff-muted focus:outline-none focus:ring-2 focus:ring-ff-purple/15"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-gray-2" />
              <span className="truncate">Search by title or keyword</span>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-ff-border bg-ff-bg px-1.5 py-0.5 text-[10px] font-medium text-ff-gray-2">
                Ctrl + K
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => success("Invite — Coming Soon")}
              className="hidden h-9 items-center gap-1.5 rounded-lg bg-ff-purple px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-ff-purple-hover sm:inline-flex"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>

            <div className="relative hidden sm:block" ref={captureRef}>
              <button
                type="button"
                onClick={() => setCaptureOpen((v) => !v)}
                className="ff-btn-primary h-9"
                aria-expanded={captureOpen}
              >
                <Camera className="h-4 w-4" />
                Capture
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </button>
              {captureOpen ? (
                <div className="ff-menu left-auto right-0 w-60" role="menu">
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => soon("Add to live meeting")}
                  >
                    <Video className="h-4 w-4 text-ff-gray-2" />
                    Add to live meeting
                  </button>
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => soon("Capture Slack Huddles")}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-[#4A154B] text-[8px] font-bold text-white">
                      S
                    </span>
                    Capture Slack Huddles
                  </button>
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => soon("Schedule new meeting")}
                  >
                    <Calendar className="h-4 w-4 text-ff-gray-2" />
                    Schedule new meeting
                  </button>
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => {
                      setCaptureOpen(false);
                      onNewMeeting?.();
                    }}
                  >
                    <Upload className="h-4 w-4 text-ff-gray-2" />
                    Upload audio or video
                  </button>
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => soon("Start recording")}
                  >
                    <Mic className="h-4 w-4 text-ff-gray-2" />
                    Start recording
                  </button>
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="rounded-lg p-2 text-ff-gray transition hover:bg-[var(--ff-row-hover)] hover:text-ff-text"
              aria-label="Microphone"
              title="Coming Soon"
              onClick={() => success("Microphone — Coming Soon")}
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="relative rounded-lg p-2 text-ff-gray transition hover:bg-[var(--ff-row-hover)] hover:text-ff-text"
              aria-label="Notifications"
              title="Notifications"
              onClick={() => success("Notifications — Coming Soon")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-[var(--ff-row-hover)]"
                aria-expanded={menuOpen}
                aria-label="Profile menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316] text-[12px] font-bold text-white ring-2 ring-ff-bg">
                  {initials}
                </span>
              </button>

              {menuOpen ? (
                <div className="ff-menu right-0 w-52" role="menu">
                  <div className="border-b border-[var(--ff-border-soft)] px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-ff-text">
                      {profile.name}
                    </p>
                    <p className="text-[11px] text-ff-gray-2">{profile.email}</p>
                  </div>
                  <Link
                    href="/settings"
                    className="ff-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-4 w-4 text-ff-gray-2" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="ff-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-ff-gray-2" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CircleHelp className="h-4 w-4 text-ff-gray-2" />
                    Help
                  </button>
                  <div className="my-1 border-t border-[var(--ff-border-soft)]" />
                  <button
                    type="button"
                    className="ff-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      router.push("/");
                    }}
                  >
                    <LogOut className="h-4 w-4 text-ff-gray-2" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
