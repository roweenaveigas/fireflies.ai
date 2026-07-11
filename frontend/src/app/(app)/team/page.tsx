"use client";

import { Lock, MailPlus, Share2, Users } from "lucide-react";
import { ComingSoonBadge } from "@/components/ui/PageHeader";
import { avatarColor, getInitials } from "@/lib/format";

const members = [
  { name: "Maya Chen", email: "maya.chen@acme.io", role: "Admin" },
  { name: "Jordan Blake", email: "jordan.blake@acme.io", role: "Editor" },
  { name: "Priya Nair", email: "priya.nair@acme.io", role: "Editor" },
  { name: "Sam Okonkwo", email: "sam.okonkwo@acme.io", role: "Viewer" },
];

const sharedMeetings = [
  { title: "Northwind QBR — Product Walkthrough", sharedWith: "CS Team" },
  { title: "Sprint 24 Planning — Meetings Experience", sharedWith: "Platform" },
  { title: "Discovery Call — Brightly Health", sharedWith: "Sales" },
];

const roles = [
  {
    name: "Admin",
    description: "Manage workspace settings, billing, and member roles.",
  },
  {
    name: "Editor",
    description: "Create meetings, edit transcripts, and manage action items.",
  },
  {
    name: "Viewer",
    description: "Read shared meetings and export summaries.",
  },
];

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-semibold text-ff-text">Team</h1>
            <ComingSoonBadge />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ff-gray">
            Invite teammates, share meetings, and manage roles.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 self-start rounded-lg bg-[#6C5CE7]/40 px-4 py-2.5 text-sm font-medium text-white"
        >
          <MailPlus className="h-4 w-4" />
          Invite Members
        </button>
      </div>

      <div className="rounded-xl border border-[#6C5CE7]/20 bg-[#F3F0FF] px-4 py-3 text-sm text-[#5B4CDB]">
        <span className="font-semibold">Coming Soon:</span> Real authentication
        and shared workspaces are out of scope for this assignment.
      </div>

      <section className="ff-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#6C5CE7]" />
          <h2 className="text-sm font-semibold text-ff-text">Team members</h2>
        </div>
        <ul className="divide-y divide-[var(--ff-border-soft)]">
          {members.map((m) => (
            <li key={m.email} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: avatarColor(m.name) }}
              >
                {getInitials(m.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ff-text">
                  {m.name}
                </p>
                <p className="truncate text-xs text-ff-gray">{m.email}</p>
              </div>
              <span className="rounded-full bg-[var(--ff-input-bg)] px-2.5 py-1 text-[11px] font-medium text-ff-gray">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ff-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-[#6C5CE7]" />
          <h2 className="text-sm font-semibold text-ff-text">Shared meetings</h2>
        </div>
        <ul className="space-y-2">
          {sharedMeetings.map((m) => (
            <li
              key={m.title}
              className="flex flex-col gap-1 rounded-lg border border-[var(--ff-border-soft)] bg-[var(--ff-input-bg)]/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm font-medium text-ff-text">{m.title}</p>
              <p className="text-xs text-ff-gray">Shared with {m.sharedWith}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ff-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#6C5CE7]" />
          <h2 className="text-sm font-semibold text-ff-text">
            Roles & permissions
          </h2>
          <ComingSoonBadge className="ml-1" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.name}
              className="rounded-xl border border-[var(--ff-border-soft)] bg-[var(--ff-input-bg)]/80 px-4 py-3"
            >
              <p className="text-sm font-semibold text-ff-text">{role.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-ff-gray">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
