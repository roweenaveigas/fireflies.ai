import api from "@/lib/api";
import type {
  ActionItem,
  ActionItemCreate,
  ActionItemUpdate,
  MeetingCreatePayload,
  MeetingDetail,
  MeetingListResponse,
  MeetingUpdatePayload,
  MeetingsQuery,
} from "@/lib/types";

export async function fetchMeetings(
  params: MeetingsQuery = {}
): Promise<MeetingListResponse> {
  const { data } = await api.get<MeetingListResponse>("/api/meetings", {
    params: {
      q: params.q || undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      sort: params.sort || "recency",
      tag: params.tag || undefined,
    },
  });
  return data;
}

export async function fetchMeeting(id: number): Promise<MeetingDetail> {
  const { data } = await api.get<MeetingDetail>(`/api/meetings/${id}`);
  return data;
}

export async function createMeeting(
  payload: MeetingCreatePayload
): Promise<MeetingDetail> {
  const { data } = await api.post<MeetingDetail>("/api/meetings", payload);
  return data;
}

export async function updateMeeting(
  id: number,
  payload: MeetingUpdatePayload
): Promise<MeetingDetail> {
  const { data } = await api.put<MeetingDetail>(`/api/meetings/${id}`, payload);
  return data;
}

export async function deleteMeeting(id: number): Promise<void> {
  await api.delete(`/api/meetings/${id}`);
}

export async function createActionItem(
  meetingId: number,
  payload: ActionItemCreate
): Promise<ActionItem> {
  const { data } = await api.post<ActionItem>(
    `/api/meetings/${meetingId}/action-items`,
    payload
  );
  return data;
}

export async function updateActionItem(
  meetingId: number,
  itemId: number,
  payload: ActionItemUpdate
): Promise<ActionItem> {
  const { data } = await api.put<ActionItem>(
    `/api/meetings/${meetingId}/action-items/${itemId}`,
    payload
  );
  return data;
}

export async function deleteActionItem(
  meetingId: number,
  itemId: number
): Promise<void> {
  await api.delete(`/api/meetings/${meetingId}/action-items/${itemId}`);
}
