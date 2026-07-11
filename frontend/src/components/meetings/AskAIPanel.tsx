"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { askAboutMeeting } from "@/lib/annotations";
import { useToast } from "@/components/ui/ToastProvider";

type ChatMsg = { role: "user" | "assistant"; content: string; mocked?: boolean };

const SUGGESTIONS = [
  "What were the action items?",
  "What decisions were made?",
  "Summarize blockers.",
];

export function AskAIPanel({ meetingId }: { meetingId: number }) {
  const { error: toastError } = useToast();
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm AskFred. Ask anything about this meeting. I'll use the transcript, summary, and action items.",
    },
  ]);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    try {
      const res = await askAboutMeeting(meetingId, trimmed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, mocked: res.mocked },
      ]);
    } catch {
      toastError("Ask AI failed.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry — I couldn't answer that right now.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(question);
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ff-soft text-ff-purple">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ff-text">Ask AI</h3>
          <p className="text-[11px] text-ff-gray-2">AskFred · meeting context</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => void ask(s)}
            className="rounded-full border border-ff-border bg-ff-bg px-2.5 py-1 text-[11px] font-medium text-ff-gray transition hover:border-ff-muted hover:text-ff-purple"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-ff-border-soft bg-[var(--ff-input-bg)] p-3">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-6 bg-ff-purple text-white"
                : "mr-4 border border-ff-border bg-ff-bg text-ff-text"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
            {m.role === "assistant" && m.mocked ? (
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ff-gray-2">
                Mocked response
              </p>
            ) : null}
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-ff-gray">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-ff-purple" />
            Thinking…
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this meeting…"
          className="ff-input"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          className="ff-btn-primary shrink-0"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
