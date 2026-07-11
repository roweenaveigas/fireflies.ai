"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, MessageSquare, Search } from "lucide-react";

type FilterTab =
  | "all"
  | "audio"
  | "ats"
  | "crm"
  | "more";

type Integration = {
  id: string;
  name: string;
  description: string;
  category: FilterTab;
  connected?: boolean;
  icon: ReactNode;
};

/** Stylized brand marks (not official trademark assets). */
function HubSpotIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#FF7A59" />
      <circle cx="20" cy="14" r="3.5" fill="#fff" />
      <path
        d="M14 22c0-3.3 2.7-6 6-6s6 2.7 6 6v8H14V22z"
        fill="#fff"
      />
      <circle cx="12" cy="18" r="2" fill="#fff" />
      <path d="M12 18h4" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function SalesforceIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#00A1E0" />
      <ellipse cx="16" cy="20" rx="8" ry="6" fill="#fff" opacity="0.95" />
      <ellipse cx="24" cy="18" rx="9" ry="7" fill="#fff" />
      <ellipse cx="20" cy="24" rx="7" ry="5" fill="#fff" opacity="0.9" />
    </svg>
  );
}

function JiraIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#0052CC" />
      <path d="M20 8l10 10-10 10-10-10 10-10z" fill="#2684FF" />
      <path d="M20 14l6 6-6 6-6-6 6-6z" fill="#fff" />
    </svg>
  );
}

function AsanaIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#F06A6A" />
      <circle cx="20" cy="14" r="4.5" fill="#fff" />
      <circle cx="13" cy="26" r="4.5" fill="#fff" />
      <circle cx="27" cy="26" r="4.5" fill="#fff" />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#fff" stroke="#E5E7EB" />
      <rect x="16" y="8" width="5" height="12" rx="2.5" fill="#E01E5A" />
      <rect x="16" y="22" width="5" height="5" rx="2.5" fill="#E01E5A" />
      <rect x="22" y="16" width="12" height="5" rx="2.5" fill="#36C5F0" />
      <rect x="13" y="16" width="5" height="5" rx="2.5" fill="#36C5F0" />
      <rect x="19" y="22" width="5" height="12" rx="2.5" fill="#2EB67D" />
      <rect x="19" y="13" width="5" height="5" rx="2.5" fill="#2EB67D" />
      <rect x="6" y="19" width="12" height="5" rx="2.5" fill="#ECB22E" />
      <rect x="22" y="19" width="5" height="5" rx="2.5" fill="#ECB22E" />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <path
        d="M14 10h8l6 20h-5.5l-1.2-4H16l-1.2 4H10L14 10zm3.2 12h4.2L19.2 14l-1.8 8z"
        fill="#111"
      />
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#F8F9FA" />
      <path d="M14 28h16l-5-9H9l5 9z" fill="#4285F4" />
      <path d="M20 10l8 14H12L20 10z" fill="#EA4335" />
      <path d="M9 28l5-9 5 9H9z" fill="#FBBC04" />
      <path d="M25 19l5 9h-10l5-9z" fill="#34A853" />
    </svg>
  );
}

function ZapierIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#FF4A00" />
      <path
        d="M20 8l2.2 7.2L29 18l-6.8 2.2L20 28l-2.2-7.8L11 18l6.8-2.8L20 8z"
        fill="#fff"
      />
      <circle cx="20" cy="18" r="3" fill="#FF4A00" />
    </svg>
  );
}

function N8nIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#EA4B71" />
      <circle cx="12" cy="20" r="4" fill="#fff" />
      <circle cx="28" cy="14" r="4" fill="#fff" />
      <circle cx="28" cy="26" r="4" fill="#fff" />
      <path d="M16 20h8M24 14v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function FirefliesApiIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <defs>
        <linearGradient id="ffApi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#ffApi)" />
      <path
        d="M14 28V12h8.5c3.5 0 5.5 2 5.5 5s-2 5-5.5 5H18v6H14zm4-10h4c1.5 0 2.5-.8 2.5-2.2S23.5 14 22 14h-4v4z"
        fill="#fff"
      />
    </svg>
  );
}

function AwsQIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#232F3E" />
      <path
        d="M12 22c0-5 3.5-9 8-9s8 4 8 9-3.5 9-8 9c-1.5 0-3-.3-4.2-.9L12 32v-4.5C12 26 12 24 12 22z"
        fill="#8C4FFF"
      />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui,sans-serif"
      >
        Q
      </text>
    </svg>
  );
}

function BambooHrIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#73C41D" />
      <path
        d="M20 8c-2 4-6 6-6 12 0 4 2.5 8 6 10 3.5-2 6-6 6-10 0-6-4-8-6-12z"
        fill="#fff"
      />
      <path d="M20 14v16" stroke="#73C41D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#0061D5" />
      <rect x="10" y="12" width="20" height="16" rx="2" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M10 18h20" stroke="#fff" strokeWidth="2.5" />
    </svg>
  );
}

const integrations: Integration[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    description:
      "Automatically send transcript data to HubSpot after a meeting and keep CRM records up to date.",
    category: "crm",
    connected: true,
    icon: <HubSpotIcon />,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description:
      "Push meeting notes, summaries, and action items into Salesforce records.",
    category: "crm",
    icon: <SalesforceIcon />,
  },
  {
    id: "jira",
    name: "Jira Projects",
    description:
      "Create and update Jira issues from action items captured in meetings.",
    category: "more",
    icon: <JiraIcon />,
  },
  {
    id: "asana",
    name: "Asana",
    description:
      "Turn meeting tasks into Asana projects and assignments automatically.",
    category: "ats",
    icon: <AsanaIcon />,
  },
  {
    id: "slack",
    name: "Slack Assistant",
    description:
      "Share summaries and digests to Slack channels after every meeting.",
    category: "more",
    icon: <SlackIcon />,
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Sync meeting notes and wikis into your Notion workspace.",
    category: "more",
    icon: <NotionIcon />,
  },
  {
    id: "gdrive",
    name: "Google Drive",
    description:
      "Store recordings, transcripts, and exports alongside your Drive files.",
    category: "audio",
    icon: <GoogleDriveIcon />,
  },
  {
    id: "zapier",
    name: "Zapier",
    description:
      "Connect Fireflies to thousands of apps with no-code automations.",
    category: "more",
    icon: <ZapierIcon />,
  },
  {
    id: "n8n",
    name: "n8n",
    description:
      "Build custom automation workflows with meeting webhooks.",
    category: "more",
    icon: <N8nIcon />,
  },
  {
    id: "api",
    name: "Fireflies API",
    description:
      "Programmatically fetch transcripts, summaries, and action items.",
    category: "more",
    icon: <FirefliesApiIcon />,
  },
  {
    id: "awsq",
    name: "AWS Q",
    description:
      "Surface meeting knowledge inside Amazon Q Business.",
    category: "more",
    icon: <AwsQIcon />,
  },
  {
    id: "bamboohr",
    name: "BambooHR",
    description:
      "Link interview notes and reviews to employee records.",
    category: "ats",
    icon: <BambooHrIcon />,
  },
  {
    id: "box",
    name: "Box",
    description:
      "File meeting recordings and documents securely in Box.",
    category: "audio",
    icon: <BoxIcon />,
  },
];

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "audio", label: "Audio recording" },
  { key: "ats", label: "Applicant tracking system" },
  { key: "crm", label: "CRM" },
  { key: "more", label: "More" },
];

export default function IntegrationsPage() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return integrations.filter((item) => {
      const matchesTab = tab === "all" || item.category === tab;
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [tab, query]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-ff-text">Integrations</h1>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${
                tab === t.key
                  ? "border-transparent bg-[#6C5CE7] text-white"
                  : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#D1D5DB] dark:border-ff-border dark:bg-ff-bg dark:text-ff-gray"
              }`}
            >
              {t.label}
              {t.key === "more" ? (
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              ) : null}
            </button>
          ))}
        </div>

        <label className="relative block w-full lg:max-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-gray-2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#6C5CE7]/40 dark:border-ff-border dark:bg-ff-bg"
          />
        </label>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ff-gray hover:text-[#6C5CE7]"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Share Feedback
      </button>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] px-6 py-12 text-center dark:border-ff-border">
          <p className="text-sm font-semibold text-ff-text">No matches</p>
          <p className="mt-1 text-sm text-ff-gray">
            Try a different filter or search term.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="relative flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:shadow-md dark:border-ff-border dark:bg-ff-bg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="shrink-0">{item.icon}</div>
                {item.connected ? (
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-white"
                    title="Connected"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-[15px] font-semibold text-ff-text">
                {item.name}
              </h2>
              <p className="mt-0.5 text-[12px] text-ff-gray-2">Fireflies</p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ff-gray">
                {item.description}
              </p>
              <button
                type="button"
                disabled
                className={`mt-5 w-full cursor-not-allowed rounded-lg border px-3 py-2.5 text-[13px] font-medium ${
                  item.connected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "border-[#E5E7EB] bg-[#F9FAFB] text-ff-gray-2 dark:border-ff-border"
                }`}
              >
                {item.connected ? "Connected" : "Coming Soon"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
