"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Lock,
  Search,
  Share2,
  Sparkles,
  Star,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV = [
  { label: "Product", hasMenu: true },
  { label: "Solutions", hasMenu: true },
  { label: "Integration", hasMenu: false },
  { label: "Resources", hasMenu: true },
  { label: "Enterprise", hasMenu: false },
  { label: "Pricing", hasMenu: false },
];

function LandingLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3.5C7 2.67 7.67 2 8.5 2H12v6.5c0 .83-.67 1.5-1.5 1.5H7V3.5Z"
          fill="#A78BFA"
        />
        <path
          d="M12 2h3.5C16.33 2 17 2.67 17 3.5V8H13.5C12.67 8 12 7.33 12 6.5V2Z"
          fill="#7C3AED"
        />
        <path
          d="M7 10h5v5.5c0 .83-.67 1.5-1.5 1.5H8.5C7.67 17 7 16.33 7 15.5V10Z"
          fill="#8B5CF6"
        />
        <path
          d="M12 10h5v4.5c0 .83-.67 1.5-1.5 1.5H12V10Z"
          fill="#6C5CE7"
        />
        <path
          d="M9 18h3v3.5c0 .83-.67 1.5-1.5 1.5H9.5C8.67 23 8 22.33 8 21.5 8 19.57 8.9 18 9 18Z"
          fill="#C084FC"
        />
        <path
          d="M12 18h2.5c.83 0 1.5.67 1.5 1.5S15.33 21 14.5 21H12v-3Z"
          fill="#A855F7"
        />
      </svg>
      <span className="text-[18px] font-semibold tracking-tight text-white">
        fireflies.ai
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="mx-auto w-full max-w-[980px] overflow-hidden rounded-t-2xl border border-white/10 bg-white shadow-[0_-20px_80px_rgba(108,92,231,0.25)]">
      <div className="flex min-h-[320px] sm:min-h-[380px]">
        {/* Mini sidebar */}
        <aside className="hidden w-12 shrink-0 flex-col items-center gap-3 border-r border-[#E5E7EB] bg-[#F8F7FC] py-4 sm:flex">
          <span className="h-7 w-7 rounded-md bg-[#6C5CE7]/15" />
          <Search className="h-4 w-4 text-[#9CA3AF]" />
          <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-[12px] text-[#6B7280]">
              <span className="truncate font-medium text-[#111827]">
                # Sales / Kickoff Call - Fireflies.ai x Acme
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] font-bold text-[#DC2626]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                REC
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="hidden rounded-md bg-[#6C5CE7] px-2.5 py-1 text-[11px] font-semibold text-white sm:inline-flex sm:items-center sm:gap-1"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
              <span className="h-7 w-7 rounded-full bg-[#F97316] text-center text-[11px] font-bold leading-7 text-white">
                M
              </span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3 p-4 sm:p-5">
              <h3 className="text-[18px] font-semibold text-[#111827] sm:text-[20px]">
                Kickoff Call - Fireflies.ai x Acme
              </h3>
              <div className="flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95]">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-[12px] font-semibold text-white backdrop-blur"
                >
                  <Video className="h-4 w-4" />
                  Video
                </button>
              </div>
              <div className="rounded-xl border border-dashed border-[#C4B5FD] bg-[#F5F3FF] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6C5CE7]">
                  Action Items
                </p>
                <p className="mt-1 text-[12px] text-[#6B7280]">
                  Send pricing deck · Schedule follow-up · Share recording
                </p>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB] bg-[#FAFAFB] p-4 lg:border-l lg:border-t-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#111827]">
                  Transcript
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    readOnly
                    placeholder="Search"
                    className="w-28 rounded-md border border-[#E5E7EB] bg-white py-1 pl-7 pr-2 text-[11px] outline-none"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    who: "Alex",
                    text: "Thanks for joining — let's align on goals for this quarter.",
                  },
                  {
                    who: "Jordan",
                    text: "We want faster follow-ups after every customer call.",
                  },
                  {
                    who: "Alex",
                    text: "Fireflies can capture notes, action items, and search.",
                  },
                ].map((line) => (
                  <div key={line.text} className="text-[12px] leading-relaxed">
                    <p className="font-semibold text-[#6C5CE7]">{line.who}</p>
                    <p className="text-[#4B5563]">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuth();
  const [bannerOpen, setBannerOpen] = useState(true);
  const [cookiesOpen, setCookiesOpen] = useState(true);

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07041A] text-white">
      {/* Starfield */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 80px 120px, rgba(255,255,255,0.25), transparent), radial-gradient(1.5px 1.5px at 160px 80px, rgba(196,181,253,0.45), transparent), radial-gradient(1px 1px at 240px 200px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 320px 40px, rgba(255,255,255,0.3), transparent)",
          backgroundSize: "360px 240px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,_rgba(108,92,231,0.35),_transparent_60%)]"
      />

      {bannerOpen ? (
        <div className="relative z-20 flex items-center justify-center gap-2 bg-[#6C5CE7] px-4 py-2.5 text-center text-[13px] font-medium text-white">
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            New
          </span>
          <span>
            Fireflies launches Live Assist &amp; Desktop App.{" "}
            <button type="button" className="underline underline-offset-2">
              Learn More
            </button>
          </span>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/10"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <header className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <LandingLogo />

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className="inline-flex items-center gap-1 text-[14px] font-medium text-white/85 transition hover:text-white"
            >
              {item.label}
              {item.hasMenu ? <ChevronDown className="h-3.5 w-3.5 opacity-70" /> : null}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="px-2 text-[14px] font-medium text-white/90 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="hidden rounded-lg border border-white/25 bg-white px-3.5 py-2 text-[13px] font-semibold text-[#111827] transition hover:bg-white/90 sm:inline-flex"
          >
            Request Demo
          </Link>
          <Link
            href="/signup"
            className="inline-flex rounded-lg bg-[#6C5CE7] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#5B4CDB]"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-0 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[36px] font-bold leading-[1.1] tracking-tight text-white sm:text-[52px]">
            The #1 AI Notetaker For Your Meetings
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
            Transcribe, summarize, search, and analyze all your team
            conversations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-[#6C5CE7] px-5 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[#6C5CE7]/30 transition hover:bg-[#5B4CDB]"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-white/30 bg-transparent px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-white/5"
            >
              Request Demo
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              Rated 4.8 / 5
              <span className="inline-flex text-[#FBBF24]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              GDPR, SOC2, More
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-[1040px] sm:mt-16">
          <ProductPreview />
        </div>
      </main>

      {cookiesOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#1A1625]/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-white">Your privacy</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-white/65">
                We use cookies to improve your experience and analyze site
                traffic. You can accept all cookies or manage preferences.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCookiesOpen(false)}
                className="rounded-lg border border-white/20 px-3.5 py-2 text-[13px] font-semibold text-white/90 hover:bg-white/5"
              >
                Preference
              </button>
              <button
                type="button"
                onClick={() => setCookiesOpen(false)}
                className="rounded-lg bg-[#6C5CE7] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#5B4CDB]"
              >
                Accept all cookies
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
