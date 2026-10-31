import { AccessibilitySettings } from './user';
import { SpeechSettings } from './speech';

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export interface QuickPhrase {
  id: string;
  category: 'Basic' | 'Needs' | 'Emergency' | 'Feelings' | 'Social' | 'Personal';
  text: string;
  color?: string;
  usage_count?: number;
}

export interface UserPreferences {
  language: string;
  interface_language: string;
  speech_language: string;
  accessibility: AccessibilitySettings;
  speech: SpeechSettings;
  privacy: {
    history_retention_days: number;
    ephemeral_only: boolean;
    voice_cloning_consent: boolean;
  };
  custom_phrases: QuickPhrase[];
}

