"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Headphones,
  MessageSquare,
  Phone,
  PhoneOff,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRoundSearch,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useProfile } from "@/components/profile/ProfileProvider";

type TabKey = "discover" | "mine";

type AgentCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

const agents: AgentCard[] = [
  {
    title: "Screening Interview Agent",
    description:
      "Hire faster with automatic screening calls that assess candidate skills.",
    icon: UserRoundSearch,
    accent: "#EC4899",
  },
  {
    title: "Discovery Call Agent",
    description:
      "Qualify prospects with focused discovery calls that uncover needs and buying signals.",
    icon: Phone,
    accent: "#14B8A6",
  },
  {
    title: "Progress Check-In Agent",
    description:
      "Keep teams aligned with quick check-ins that surface blockers and next steps.",
    icon: ClipboardCheck,
    accent: "#8B5CF6",
  },
  {
    title: "User Testimonial Agent",
    description:
      "Capture real customer stories and turn them into ready-to-use testimonials.",
    icon: MessageSquare,
    accent: "#3B82F6",
  },
  {
    title: "Performance Review Agent",
    description:
      "Run consistent one-on-one reviews and capture feedback, goals, and growth areas.",
    icon: Star,
    accent: "#F472B6",
  },
  {
    title: "User Research Agent",
    description:
      "Run one-on-one user interviews at scale and uncover real product insights.",
    icon: Search,
    accent: "#F97316",
  },
  {
    title: "Customer Support Agent",
    description:
      "Handle inbound support calls with triage, empathy, and clear next steps.",
    icon: Headphones,
    accent: "#EF4444",
  },
];

export default function VoiceAgentsPage() {
  const { firstName } = useProfile();
  const [tab, setTab] = useState<TabKey>("discover");
  const [bannerSlide, setBannerSlide] = useState(0);
  const [npsOpen, setNpsOpen] = useState(true);

  return (
    <div className="relative mx-auto max-w-[1120px] space-y-6 pb-24">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#E5E7EB] dark:border-ff-border">
        <button
          type="button"
          onClick={() => setTab("discover")}
          className={`relative pb-3 text-[14px] font-semibold transition ${
            tab === "discover"
              ? "text-ff-text"
              : "text-ff-gray hover:text-ff-text"
          }`}
        >
          Discover
          {tab === "discover" ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#6C5CE7]" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`relative pb-3 text-[14px] font-semibold transition ${
            tab === "mine" ? "text-ff-text" : "text-ff-gray hover:text-ff-text"
          }`}
        >
          My Voice Agents (0)
          {tab === "mine" ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#6C5CE7]" />
          ) : null}
        </button>
      </div>

      {tab === "mine" ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-16 text-center dark:border-ff-border dark:bg-ff-bg">
          <Users className="mx-auto h-10 w-10 text-[#6C5CE7]" />
          <h2 className="mt-4 text-lg font-semibold text-ff-text">
            No voice agents yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ff-gray">
            Pick a template from Discover to set up your first agent.
          </p>
          <button
            type="button"
            onClick={() => setTab("discover")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#6C5CE7] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#5B4CDB]"
          >
            Browse Discover
          </button>
        </div>
      ) : (
        <>
          {/* Hero banner */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EDE9FE] via-[#E0E7FF] to-[#DBEAFE] px-6 py-7 dark:from-[#1e1b4b]/50 dark:via-[#172554]/40 dark:to-[#1e3a5f]/40 sm:px-8 sm:py-8">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[24px] font-semibold tracking-tight text-ff-text sm:text-[28px]">
                    Experience Voice Agents
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-[#22C55E] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    + 100 free AI credits
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-ff-gray">
                  Voice Agents handle your calls, ask the right questions, and
                  deliver clear insights.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-[#6C5CE7] px-4 py-2.5 text-[13px] font-semibold text-white opacity-90"
                  >
                    <Headphones className="h-4 w-4" />
                    Try It Live
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[#6C5CE7]/40 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#6C5CE7] dark:bg-ff-bg"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Demo
                  </button>
                </div>
              </div>

              {/* Agent preview graphic */}
              <div className="relative mx-auto w-full max-w-[280px] shrink-0 lg:mx-0">
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-ff-text shadow-md dark:bg-ff-bg">
                  How do you handle tight deadlines?
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e1b4b] to-[#312e81] p-6 shadow-xl">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center">
                    <span className="absolute h-28 w-28 animate-pulse rounded-full bg-[#A78BFA]/30 blur-md" />
                    <span className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-[#C4B5FD] via-[#818CF8] to-[#EC4899] opacity-90" />
                    <Headphones className="relative z-10 h-8 w-8 text-white" />
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white">
                      <span className="h-3 w-3 rounded-sm bg-white" />
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-lg">
                      <PhoneOff className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="mt-5 flex justify-center gap-1.5">
              {[0, 1].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setBannerSlide(i)}
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    bannerSlide === i ? "bg-[#6C5CE7]" : "bg-[#A5B4FC]"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </section>

          {/* Setup header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-ff-text">
                {firstName}, set up your Voice Agent in 2 minutes
              </h2>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-ff-gray hover:text-[#6C5CE7]"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Share Feedback
              </button>
            </div>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 self-start rounded-lg bg-[#6C5CE7] px-3.5 py-2 text-[13px] font-semibold text-white opacity-90 sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Custom Agent
            </button>
          </div>

          {/* Agent grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => {
              const Icon = agent.icon;
              return (
                <article
                  key={agent.title}
                  className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:shadow-md dark:border-ff-border dark:bg-ff-bg"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: agent.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ff-text">
                    {agent.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ff-gray">
                    {agent.description}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-fit cursor-not-allowed rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ff-text dark:border-ff-border dark:bg-ff-bg"
                  >
                    Set-Up
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* NPS prompt */}
      {npsOpen ? (
        <div className="fixed bottom-4 left-1/2 z-30 flex w-[min(520px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg dark:border-ff-border dark:bg-ff-bg">
          <Sparkles className="h-4 w-4 shrink-0 text-[#6C5CE7]" />
          <p className="min-w-0 flex-1 text-[12px] text-ff-gray">
            {firstName}, How likely are you to recommend Fireflies to a friend or
            colleague?
          </p>
          <button
            type="button"
            onClick={() => setNpsOpen(false)}
            className="shrink-0 rounded p-1 text-ff-gray-2 hover:bg-[#F3F4F6]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
