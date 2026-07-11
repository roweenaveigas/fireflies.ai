export type GeneratedMeetingDraft = {
  title: string;
  transcriptText: string;
  participants: { name: string }[];
  summary?: { overview_text: string };
  key_topics: { topic_text: string; order_index: number }[];
  action_items: { text: string; assignee?: string | null; is_completed: boolean }[];
};

function stripExt(name: string): string {
  return name.replace(/\.(txt|vtt|json)$/i, "").replace(/[_-]+/g, " ").trim();
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name || name.toLowerCase() === "speaker") continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function parseVtt(content: string): string {
  const lines: string[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line === "WEBVTT" || line.startsWith("NOTE")) continue;
    if (/^\d+$/.test(line)) continue;
    if (/-->/.test(line)) continue;
    lines.push(line);
  }
  return lines.join("\n");
}

function parseJsonTranscript(content: string): string {
  const data = JSON.parse(content) as unknown;
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data &&
        typeof data === "object" &&
        Array.isArray((data as { transcript?: unknown }).transcript)
      ? ((data as { transcript: unknown[] }).transcript)
      : data &&
          typeof data === "object" &&
          Array.isArray((data as { lines?: unknown }).lines)
        ? ((data as { lines: unknown[] }).lines)
        : [];

  if (!rows.length && data && typeof data === "object") {
    const text = (data as { text?: string; transcript_text?: string }).text ||
      (data as { transcript_text?: string }).transcript_text;
    if (typeof text === "string") return text;
  }

  return rows
    .map((row) => {
      if (typeof row === "string") return row;
      if (!row || typeof row !== "object") return "";
      const r = row as Record<string, unknown>;
      const speaker =
        (typeof r.speaker === "string" && r.speaker) ||
        (typeof r.speaker_name === "string" && r.speaker_name) ||
        (typeof r.name === "string" && r.name) ||
        "";
      const text =
        (typeof r.text === "string" && r.text) ||
        (typeof r.content === "string" && r.content) ||
        (typeof r.line === "string" && r.line) ||
        "";
      if (!text) return "";
      return speaker ? `${speaker}: ${text}` : text;
    })
    .filter(Boolean)
    .join("\n");
}

export function normalizeTranscriptFile(
  filename: string,
  content: string
): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".vtt")) return parseVtt(content);
  if (lower.endsWith(".json")) return parseJsonTranscript(content);
  return content.trim();
}

function extractSpeakers(transcriptText: string): string[] {
  const names: string[] = [];
  for (const raw of transcriptText.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || !line.includes(":")) continue;
    const name = line.split(":")[0]?.trim() ?? "";
    if (name && name.length <= 80 && !name.startsWith("http")) names.push(name);
  }
  return uniqueNames(names);
}

function extractActionItems(
  transcriptText: string,
  speakers: string[]
): GeneratedMeetingDraft["action_items"] {
  const patterns =
    /\b(action item|todo|to-do|follow[- ]?up|we (?:should|need to|will)|i(?:'ll| will)|let'?s|assign(?:ed)? to)\b/i;
  const items: GeneratedMeetingDraft["action_items"] = [];
  for (const raw of transcriptText.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || !patterns.test(line)) continue;
    let text = line;
    let assignee: string | null = null;
    if (line.includes(":")) {
      const [maybeSpeaker, ...rest] = line.split(":");
      const body = rest.join(":").trim();
      if (
        maybeSpeaker &&
        speakers.some((s) => s.toLowerCase() === maybeSpeaker.trim().toLowerCase())
      ) {
        assignee = maybeSpeaker.trim();
        text = body || line;
      }
    }
    if (text.length < 8) continue;
    items.push({
      text: text.slice(0, 280),
      assignee,
      is_completed: false,
    });
    if (items.length >= 6) break;
  }
  return items;
}

function buildSummary(transcriptText: string): string {
  const bodies = transcriptText
    .split(/\r?\n/)
    .map((l) => {
      const t = l.trim();
      if (!t) return "";
      if (t.includes(":")) return t.split(":").slice(1).join(":").trim();
      return t;
    })
    .filter((t) => t.length > 20);

  const picked = bodies.slice(0, 4);
  if (!picked.length) {
    return "Meeting transcript uploaded. Review the transcript panel for full discussion details.";
  }
  const joined = picked.join(" ");
  const summary =
    joined.length > 420 ? `${joined.slice(0, 417).trim()}…` : joined;
  return summary;
}

function buildTopics(
  transcriptText: string
): GeneratedMeetingDraft["key_topics"] {
  const bodies = transcriptText
    .split(/\r?\n/)
    .map((l) => {
      const t = l.trim();
      if (!t.includes(":")) return t;
      return t.split(":").slice(1).join(":").trim();
    })
    .filter((t) => t.length > 24);

  const topics: string[] = [];
  for (const body of bodies) {
    const topic = body.split(/[.!?]/)[0]?.trim() ?? "";
    if (topic.length < 12 || topic.length > 80) continue;
    if (topics.some((t) => t.toLowerCase() === topic.toLowerCase())) continue;
    topics.push(topic);
    if (topics.length >= 5) break;
  }
  if (!topics.length) {
    return [
      { topic_text: "Discussion overview", order_index: 0 },
      { topic_text: "Next steps", order_index: 1 },
    ];
  }
  return topics.map((topic_text, order_index) => ({ topic_text, order_index }));
}

export function autoGenerateFromTranscript(
  transcriptText: string,
  filename?: string
): GeneratedMeetingDraft {
  const text = transcriptText.trim();
  const speakers = extractSpeakers(text);
  const fromFile = filename ? stripExt(filename) : "";
  const title =
    fromFile ||
    (speakers.length
      ? `Meeting with ${speakers.slice(0, 3).join(", ")}`
      : "Uploaded transcript meeting");

  return {
    title: title.slice(0, 255),
    transcriptText: text,
    participants: speakers.map((name) => ({ name })),
    summary: { overview_text: buildSummary(text) },
    key_topics: buildTopics(text),
    action_items: extractActionItems(text, speakers),
  };
}
