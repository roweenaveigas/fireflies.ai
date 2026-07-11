"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  Keyboard,
  Moon,
  User,
} from "lucide-react";
import { useProfile } from "@/components/profile/ProfileProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useToast } from "@/components/ui/ToastProvider";

function Toggle({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-default items-start justify-between gap-4 rounded-xl border border-[var(--ff-border-soft)] bg-[var(--ff-input-bg)]/60 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ff-text">{label}</p>
        <p className="mt-0.5 text-xs text-ff-gray">{description}</p>
      </div>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        disabled
        className="mt-1 h-4 w-4 rounded border-ff-border text-ff-purple opacity-60"
        aria-label={label}
      />
    </label>
  );
}

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, initials, updateProfile } = useProfile();
  const { success } = useToast();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [workspace, setWorkspace] = useState(profile.workspace);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setWorkspace(profile.workspace);
  }, [profile]);

  const dirty =
    name.trim() !== profile.name ||
    email.trim() !== profile.email ||
    workspace.trim() !== profile.workspace;

  const saveProfile = () => {
    if (!name.trim() || !email.trim()) {
      return;
    }
    updateProfile({ name, email, workspace });
    success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-ff-text">Settings</h1>
        <p className="mt-1 text-sm text-ff-gray">
          Manage your profile, workspace, and appearance. Profile and theme are
          saved on this device.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ff-border bg-ff-bg px-3 py-1.5 text-[12px] font-semibold text-ff-gray transition hover:border-ff-muted hover:text-ff-text"
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </a>
          );
        })}
      </div>

      <section id="profile" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-ff-purple" />
            <h2 className="text-sm font-semibold text-ff-text">Profile</h2>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={!dirty || !name.trim() || !email.trim()}
            className="rounded-lg bg-[#6C5CE7] px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#5B4CDB] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-lg font-semibold text-white">
            {initials}
          </span>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ff-gray">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="ff-input"
                autoComplete="name"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ff-gray">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ff-input"
                autoComplete="email"
              />
            </label>
          </div>
        </div>
      </section>

      <section id="workspace" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-ff-purple" />
          <h2 className="text-sm font-semibold text-ff-text">Workspace</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ff-gray">
              Workspace name
            </span>
            <input
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="ff-input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ff-gray">
              Default language
            </span>
            <input
              type="text"
              defaultValue="English (Global)"
              disabled
              className="ff-input bg-[var(--ff-input-bg)] text-ff-gray"
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-ff-gray-2">
          Workspace name saves with your profile. Admin controls are coming soon.
        </p>
      </section>

      <section id="notifications" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-ff-purple" />
          <h2 className="text-sm font-semibold text-ff-text">Notifications</h2>
        </div>
        <div className="space-y-2">
          <Toggle
            label="Email notifications"
            description="Get notified when transcripts and summaries are ready."
            defaultChecked
          />
          <Toggle
            label="Meeting reminders"
            description="Reminders before upcoming meetings on your calendar."
            defaultChecked
          />
          <Toggle
            label="Weekly summaries"
            description="A digest of meetings, action items, and highlights."
          />
        </div>
      </section>

      <section id="appearance" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-4 w-4 text-ff-purple" />
          <h2 className="text-sm font-semibold text-ff-text">Appearance</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { id: "light", label: "Light", hint: "Bright canvas" },
              { id: "dark", label: "Dark", hint: "Low-light UI" },
              { id: "system", label: "System", hint: "Match OS" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                theme === opt.id
                  ? "border-ff-purple/40 bg-ff-soft text-ff-purple"
                  : "border-ff-border bg-[var(--ff-input-bg)] text-ff-gray hover:border-ff-muted"
              }`}
            >
              {opt.label}
              <span className="mt-1 block text-xs font-normal text-ff-gray-2">
                {opt.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="shortcuts" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-ff-purple" />
          <h2 className="text-sm font-semibold text-ff-text">Shortcuts</h2>
        </div>
        <ul className="space-y-2 text-sm text-ff-gray">
          {[
            ["⌘ / Ctrl + K", "Global search"],
            ["Space", "Play / pause media"],
            ["← / →", "Seek ±10 seconds"],
          ].map(([keys, desc]) => (
            <li
              key={keys}
              className="flex items-center justify-between rounded-lg border border-[var(--ff-border-soft)] px-3 py-2"
            >
              <span>{desc}</span>
              <kbd className="rounded-md bg-[var(--ff-input-bg)] px-2 py-0.5 text-[11px] font-semibold text-ff-text">
                {keys}
              </kbd>
            </li>
          ))}
        </ul>
      </section>

      <section id="billing" className="ff-card scroll-mt-24 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-ff-purple" />
          <h2 className="text-sm font-semibold text-ff-text">Billing</h2>
        </div>
        <div className="rounded-xl border border-dashed border-ff-border bg-[var(--ff-input-bg)]/50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ff-text">Free plan</p>
          <p className="mt-1 text-xs text-ff-gray">
            Billing and plan upgrades are coming soon.
          </p>
          <button type="button" disabled className="ff-btn-primary mt-4 opacity-50">
            Upgrade
          </button>
        </div>
      </section>
    </div>
  );
}
