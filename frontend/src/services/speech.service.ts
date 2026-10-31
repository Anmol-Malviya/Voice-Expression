import { VoiceOption, SpeechSettings } from '@/types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  isSttSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  async getVoices(): Promise<VoiceOption[]> {
    if (!this.synth) return [];

    let voices = this.synth.getVoices();
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const handler = () => {
          voices = this.synth?.getVoices() || [];
          this.synth?.removeEventListener('voiceschanged', handler);
          resolve();
        };
        this.synth?.addEventListener('voiceschanged', handler);
        setTimeout(resolve, 800);
      });
    }

    return voices.map((v) => ({
      id: v.voiceURI || v.name,
      name: `${v.name} (${v.lang})`,
      lang: v.lang,
      isLocal: v.localService,
    }));
  }

  speak(
    text: string,
    options: {
      rate?: number;
      volume?: number;
      voiceId?: string | null;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): boolean {
    if (!this.synth) {
      if (options.onError) options.onError('Speech synthesis not supported in this browser.');
      return false;
    }

    try {
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.volume = options.volume ?? 1.0;

      if (options.voiceId) {
        const allVoices = this.synth.getVoices();
        const matched = allVoices.find((v) => (v.voiceURI || v.name) === options.voiceId);
        if (matched) utterance.voice = matched;
      }

      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (options.onError) options.onError(e);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (err) {
      if (options.onError) options.onError(err);
      return false;
    }
  }

  pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  createSpeechRecognition(options: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult: (finalText: string, interimText: string) => void;
    onError: (error: string) => void;
    onEnd: () => void;
  }): any | null {
    if (!this.isSttSupported()) {
      options.onError('Browser Speech Recognition (STT) is not supported in this browser. You can still type directly or use Quick Phrases.');
      return null;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();

    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.language || 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      options.onResult(final, interim);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      options.onError(event.error || 'Speech recognition encountered an issue.');
    };

    recognition.onend = () => {
      options.onEnd();
    };

    return recognition;
  }
}

export const speechService = new SpeechService();
export default speechService;

