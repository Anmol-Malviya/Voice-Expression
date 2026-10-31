export type TtsProvider = 'browser' | 'elevenlabs';

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender?: 'female' | 'male' | 'neutral';
  isLocal?: boolean;
}

export interface SpeechSettings {
  rate: number;
  pitch?: number;
  volume: number;
  voiceId?: string | null;
  provider: TtsProvider;
}

export interface TTSRequest {
  text: string;
  voice_id?: string;
  rate?: number;
  volume?: number;
  language?: string;
}

export interface AudioState {
  isSpeaking: boolean;
  isPaused: boolean;
  isListening: boolean;
  interimTranscript: string;
  error?: string | null;
}

