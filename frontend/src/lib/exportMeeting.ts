import type { MeetingDetail } from "@/lib/types";
import { formatClock, formatDuration, formatMeetingDate } from "@/lib/format";

function speakerName(meeting: MeetingDetail, lineId: number): string {
  const line = meeting.transcript_lines.find((l) => l.id === lineId);
  return line?.speaker?.name ?? "Speaker";
}

export function buildMeetingMarkdown(meeting: MeetingDetail): string {
  const parts: string[] = [
    `# ${meeting.title}`,
    "",
    `- **Date:** ${formatMeetingDate(meeting.date)}`,
    `- **Duration:** ${formatDuration(meeting.duration_minutes)}`,
    `- **Participants:** ${meeting.participants.map((p) => p.name).join(", ") || "—"}`,
  ];
  if (meeting.tags?.length) {
    parts.push(`- **Tags:** ${meeting.tags.map((t) => t.name).join(", ")}`);
  }
  parts.push("");

  if (meeting.summary?.overview_text) {
    parts.push("## Summary", "", meeting.summary.overview_text, "");
  }
  if (meeting.key_topics?.length) {
    parts.push("## Key Topics", "");
    meeting.key_topics
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .forEach((t, i) => parts.push(`${i + 1}. ${t.topic_text}`));
    parts.push("");
  }
  if (meeting.action_items?.length) {
    parts.push("## Action Items", "");
    meeting.action_items.forEach((a) => {
      const box = a.is_completed ? "[x]" : "[ ]";
      const who = a.assignee ? ` (@${a.assignee})` : "";
      parts.push(`- ${box} ${a.text}${who}`);
    });
    parts.push("");
  }
  parts.push("## Transcript", "");
  meeting.transcript_lines.forEach((line) => {
    const name = line.speaker?.name ?? "Speaker";
    parts.push(
      `**${name}** (${formatClock(line.start_time_seconds)}): ${line.text}`
    );
    parts.push("");
  });
  return parts.join("\n");
}

export function buildMeetingPlainText(meeting: MeetingDetail): string {
  return buildMeetingMarkdown(meeting)
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^- /gm, "• ");
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMeetingMarkdown(meeting: MeetingDetail) {
  const slug = meeting.title.replace(/[^\w\-]+/g, "_").slice(0, 60);
  downloadBlob(`${slug}.md`, buildMeetingMarkdown(meeting), "text/markdown");
}

export function exportMeetingText(meeting: MeetingDetail) {
  const slug = meeting.title.replace(/[^\w\-]+/g, "_").slice(0, 60);
  downloadBlob(`${slug}.txt`, buildMeetingPlainText(meeting), "text/plain");
}

export function exportMeetingPdf(meeting: MeetingDetail) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>${escapeHtml(meeting.title)}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; color: #1f1f2e; padding: 32px; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  h2 { font-size: 15px; margin: 24px 0 8px; color: #6c5ce7; }
  .meta { color: #6b6b80; font-size: 13px; }
  .line { margin: 8px 0; font-size: 13px; }
  .speaker { font-weight: 600; }
  .time { color: #9a9aaf; font-size: 11px; margin-left: 6px; }
</style></head><body>
<h1>${escapeHtml(meeting.title)}</h1>
<p class="meta">${escapeHtml(formatMeetingDate(meeting.date))} · ${escapeHtml(
    formatDuration(meeting.duration_minutes)
  )} · ${escapeHtml(meeting.participants.map((p) => p.name).join(", "))}</p>
${
  meeting.summary?.overview_text
    ? `<h2>Summary</h2><p>${escapeHtml(meeting.summary.overview_text)}</p>`
    : ""
}
${
  meeting.key_topics?.length
    ? `<h2>Key Topics</h2><ol>${meeting.key_topics
        .map((t) => `<li>${escapeHtml(t.topic_text)}</li>`)
        .join("")}</ol>`
    : ""
}
${
  meeting.action_items?.length
    ? `<h2>Action Items</h2><ul>${meeting.action_items
        .map(
          (a) =>
            `<li>${a.is_completed ? "✓ " : ""}${escapeHtml(a.text)}${
              a.assignee ? ` — ${escapeHtml(a.assignee)}` : ""
            }</li>`
        )
        .join("")}</ul>`
    : ""
}
<h2>Transcript</h2>
${meeting.transcript_lines
  .map(
    (line) =>
      `<div class="line"><span class="speaker">${escapeHtml(
        line.speaker?.name ?? "Speaker"
      )}</span><span class="time">${escapeHtml(
        formatClock(line.start_time_seconds)
      )}</span><div>${escapeHtml(line.text)}</div></div>`
  )
  .join("")}
<script>window.onload=()=>{window.print();}</script>
</body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) {
    throw new Error("Popup blocked — allow popups to export PDF.");
  }
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function lineLabel(meeting: MeetingDetail, lineId: number) {
  return speakerName(meeting, lineId);
}
