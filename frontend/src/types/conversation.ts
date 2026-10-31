export type SessionStatus = 'active' | 'completed' | 'archived';

export interface ConversationSummary {
  id: string;
  title: string;
  date: string;
  time?: string;
  updated_at?: string;
  language: string;
  messages_count: number;
  last_message_preview?: string;
  status?: SessionStatus;
}

export interface ConversationSession {
  id: string;
  title: string;
  user_id?: string;
  language: string;
  mode: 'live_conversation' | 'gesture_guided' | 'emergency';
  created_at: string;
  updated_at: string;
  status: SessionStatus;
  messages_count?: number;
}

export interface CreateConversationDto {
  title?: string;
  language?: string;
  mode?: 'live_conversation' | 'gesture_guided' | 'emergency';
}

