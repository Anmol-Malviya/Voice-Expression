import { create } from 'zustand';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
  accessibility_settings?: Record<string, any>;
  voice_consent?: boolean;
}

interface AppState {
  // Auth
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  loginAsDemo: () => void;

  // Accessibility
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  language: string;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  cycleFontSize: () => void;
  toggleHighContrast: () => void;
  toggleTheme: () => void;
  toggleReducedMotion: () => void;
  setLanguage: (lang: string) => void;

  // Speech (TTS & STT)
  speechRate: number;
  volume: number;
  isSpeaking: boolean;
  isPaused: boolean;
  isListening: boolean;
  interimTranscript: string;
  selectedVoice: string | null;
  ttsProvider: 'browser' | 'elevenlabs';
  setSpeechRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setIsPaused: (paused: boolean) => void;
  setIsListening: (listening: boolean) => void;
  setInterimTranscript: (text: string) => void;
  setSelectedVoice: (voice: string | null) => void;
  setTtsProvider: (provider: 'browser' | 'elevenlabs') => void;
}

const DEMO_USER: UserProfile = {
  id: 'usr_demo_alex',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  preferred_language: 'en',
  accessibility_settings: {
    font_size: 'large',
    high_contrast: false,
    theme: 'light',
    reduced_motion: false,
  },
  voice_consent: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: typeof window !== 'undefined' && localStorage.getItem('voice_user')
    ? JSON.parse(localStorage.getItem('voice_user')!)
    : DEMO_USER,
  token: typeof window !== 'undefined' ? localStorage.getItem('voice_token') || 'demo_token' : 'demo_token',
  isAuthenticated: true,

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem('voice_user', JSON.stringify(user));
      else localStorage.removeItem('voice_user');
    }
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('voice_token', token);
      else localStorage.removeItem('voice_token');
    }
    set({ token, isAuthenticated: !!token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voice_token');
      localStorage.removeItem('voice_user');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  loginAsDemo: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voice_token', 'demo_jwt_token_alex');
      localStorage.setItem('voice_user', JSON.stringify(DEMO_USER));
    }
    set({ user: DEMO_USER, token: 'demo_jwt_token_alex', isAuthenticated: true });
  },

  // Accessibility
  fontSize: (typeof window !== 'undefined' && (localStorage.getItem('pref_font_size') as any)) || 'large',
  highContrast: typeof window !== 'undefined' && localStorage.getItem('pref_high_contrast') === 'true',
  theme: (typeof window !== 'undefined' && (localStorage.getItem('pref_theme') as any)) || 'light',
  reducedMotion: typeof window !== 'undefined' && localStorage.getItem('pref_reduced_motion') === 'true',
  language: typeof window !== 'undefined' ? localStorage.getItem('pref_language') || 'en' : 'en',

  setFontSize: (fontSize) => {
    if (typeof window !== 'undefined') localStorage.setItem('pref_font_size', fontSize);
    set({ fontSize });
  },

  cycleFontSize: () => {
    const cur = get().fontSize;
    const next = cur === 'normal' ? 'large' : cur === 'large' ? 'xlarge' : 'normal';
    if (typeof window !== 'undefined') localStorage.setItem('pref_font_size', next);
    set({ fontSize: next });
  },

  toggleHighContrast: () => {
    const next = !get().highContrast;
    if (typeof window !== 'undefined') localStorage.setItem('pref_high_contrast', String(next));
    set({ highContrast: next });
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') localStorage.setItem('pref_theme', next);
    set({ theme: next });
  },

  toggleReducedMotion: () => {
    const next = !get().reducedMotion;
    if (typeof window !== 'undefined') localStorage.setItem('pref_reduced_motion', String(next));
    set({ reducedMotion: next });
  },

  setLanguage: (language) => {
    if (typeof window !== 'undefined') localStorage.setItem('pref_language', language);
    set({ language });
  },

  // Speech
  speechRate: 1.0,
  volume: 1.0,
  isSpeaking: false,
  isPaused: false,
  isListening: false,
  interimTranscript: '',
  selectedVoice: null,
  ttsProvider: 'browser',

  setSpeechRate: (speechRate) => set({ speechRate }),
  setVolume: (volume) => set({ volume }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsPaused: (isPaused) => set({ isPaused }),
  setIsListening: (isListening) => set({ isListening }),
  setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
  setSelectedVoice: (selectedVoice) => set({ selectedVoice }),
  setTtsProvider: (ttsProvider) => set({ ttsProvider }),
}));

