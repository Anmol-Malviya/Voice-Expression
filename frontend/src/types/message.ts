export type MessageSender = 'user' | 'partner' | 'system';
export type MessageType = 
  | 'text' 
  | 'speech_transcription' 
  | 'ai_suggestion' 
  | 'tts_spoken' 
  | 'gesture_generated';

export interface FusedSignal {
  type: 'gesture' | 'facial' | 'audio_context' | 'preference';
  label: string;
  confidence: number;
}

export interface CandidateReply {
  candidate_id: string;
  text: string;
  reason: string;
  confidence: number;
  category?: string;
}

export interface Message {
  id: string;
  conversation_id?: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  type?: MessageType;
  fusedSignals?: string[];
  isSpoken?: boolean;
  confidence?: number;
  audioUrl?: string;
}

export interface SendMessageDto {
  conversation_id: string;
  content: string;
  type?: MessageType;
  fusedSignals?: string[];
}

