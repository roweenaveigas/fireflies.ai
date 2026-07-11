import api from "@/lib/api";
import type {
  AskAIResponse,
  Highlight,
  SearchResponse,
  Soundbite,
  Tag,
  TranscriptComment,
} from "@/lib/types";

export async function globalSearch(q: string): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>("/api/search", {
    params: { q },
  });
  return data;
}

export async function fetchTags(): Promise<Tag[]> {
  const { data } = await api.get<{ tags: Tag[] }>("/api/tags");
  return data.tags;
}

export async function createHighlight(
  meetingId: number,
  transcriptLineId: number
): Promise<Highlight> {
  const { data } = await api.post<Highlight>(
    `/api/meetings/${meetingId}/highlights`,
    { transcript_line_id: transcriptLineId }
  );
  return data;
}

export async function deleteHighlight(
  meetingId: number,
  highlightId: number
): Promise<void> {
  await api.delete(`/api/meetings/${meetingId}/highlights/${highlightId}`);
}

export async function createComment(
  meetingId: number,
  payload: { transcript_line_id: number; body: string; author_name?: string }
): Promise<TranscriptComment> {
  const { data } = await api.post<TranscriptComment>(
    `/api/meetings/${meetingId}/comments`,
    payload
  );
  return data;
}

export async function updateComment(
  meetingId: number,
  commentId: number,
  body: string
): Promise<TranscriptComment> {
  const { data } = await api.put<TranscriptComment>(
    `/api/meetings/${meetingId}/comments/${commentId}`,
    { body }
  );
  return data;
}

export async function deleteComment(
  meetingId: number,
  commentId: number
): Promise<void> {
  await api.delete(`/api/meetings/${meetingId}/comments/${commentId}`);
}

export async function createSoundbite(
  meetingId: number,
  payload: { transcript_line_id: number; label: string }
): Promise<Soundbite> {
  const { data } = await api.post<Soundbite>(
    `/api/meetings/${meetingId}/soundbites`,
    payload
  );
  return data;
}

export async function deleteSoundbite(
  meetingId: number,
  soundbiteId: number
): Promise<void> {
  await api.delete(`/api/meetings/${meetingId}/soundbites/${soundbiteId}`);
}

export async function askAboutMeeting(
  meetingId: number,
  question: string
): Promise<AskAIResponse> {
  const { data } = await api.post<AskAIResponse>(
    `/api/meetings/${meetingId}/ask`,
    { question }
  );
  return data;
}
