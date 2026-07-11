export type Participant = {
  id: number;
  name: string;
  email?: string | null;
};

export type Tag = {
  id: number;
  name: string;
};

export type Speaker = {
  id: number;
  meeting_id: number;
  name: string;
  color: string;
};

export type TranscriptLine = {
  id: number;
  meeting_id: number;
  speaker_id: number;
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
  order_index: number;
  speaker?: Speaker | null;
};

export type Summary = {
  id: number;
  meeting_id: number;
  overview_text: string;
  generated_at: string;
};

export type KeyTopic = {
  id: number;
  meeting_id: number;
  topic_text: string;
  order_index: number;
};

export type ActionItem = {
  id: number;
  meeting_id: number;
  text: string;
  assignee?: string | null;
  is_completed: boolean;
  created_at: string;
};

export type Highlight = {
  id: number;
  meeting_id: number;
  transcript_line_id: number;
  created_at: string;
};

export type TranscriptComment = {
  id: number;
  meeting_id: number;
  transcript_line_id: number;
  body: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

export type Soundbite = {
  id: number;
  meeting_id: number;
  transcript_line_id: number;
  label: string;
  start_time_seconds: number;
  end_time_seconds: number;
  created_at: string;
};

export type MeetingListItem = {
  id: number;
  title: string;
  date: string;
  duration: number;
  duration_minutes: number;
  participants: Participant[];
  tags?: Tag[];
  summary_preview?: string | null;
};

export type MeetingListResponse = {
  meetings: MeetingListItem[];
  total: number;
};

export type MeetingsQuery = {
  q?: string;
  date_from?: string;
  date_to?: string;
  sort?: "recency" | "oldest";
  tag?: string;
};

export type MeetingDetail = {
  id: number;
  title: string;
  date: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  participants: Participant[];
  tags: Tag[];
  speakers: Speaker[];
  transcript_lines: TranscriptLine[];
  summary?: Summary | null;
  key_topics: KeyTopic[];
  action_items: ActionItem[];
  highlights?: Highlight[];
  comments?: TranscriptComment[];
  soundbites?: Soundbite[];
};

export type ActionItemCreate = {
  text: string;
  assignee?: string | null;
  is_completed?: boolean;
};

export type ActionItemUpdate = {
  text?: string;
  assignee?: string | null;
  is_completed?: boolean;
};

export type MeetingCreatePayload = {
  title: string;
  date?: string;
  duration_minutes?: number;
  participants?: { name: string; email?: string | null }[];
  participant_ids?: number[];
  tag_names?: string[];
  tag_ids?: number[];
  transcript_text?: string;
  summary?: { overview_text: string };
  key_topics?: { topic_text: string; order_index: number }[];
  action_items?: ActionItemCreate[];
};

export type MeetingUpdatePayload = {
  title?: string;
  date?: string;
  duration_minutes?: number;
  participant_ids?: number[];
  participants?: { name: string; email?: string | null }[];
  tag_ids?: number[];
  tag_names?: string[];
};

export type SearchSnippet = {
  meeting_id: number;
  meeting_title: string;
  line_id?: number | null;
  order_index?: number | null;
  start_time_seconds?: number | null;
  snippet: string;
  match_type: string;
};

export type SearchResponse = {
  query: string;
  results: SearchSnippet[];
  total: number;
};

export type AskAIResponse = {
  answer: string;
  mocked: boolean;
  messages: { role: string; content: string }[];
};
