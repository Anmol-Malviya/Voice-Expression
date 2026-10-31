import apiClient from '@/lib/api-client';
import { VoiceOption, SpeechSettings } from '@/types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;

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
    // 1. Try to fetch backend approved voices (ElevenLabs / Standard profiles)
    try {
      const res = await apiClient.get<any[]>('/voices');
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((v) => ({
          id: v.voice_id || v.id,
          name: `${v.name || 'Voice'} (${v.language || 'en'})`,
          lang: v.language || 'en',
          isLocal: v.category !== 'cloned' && v.category !== 'standard',
        }));
      }
    } catch {
      // Fallback to local browser voices
    }

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

  /**
   * Real ElevenLabs TTS synthesis API call.
   * Returns audio Blob from POST /api/v1/speech/synthesize.
   */
  async synthesizeViaApi(
    text: string,
    options: {
      voiceId?: string | null;
      speed?: number;
      language?: string;
      modelId?: string;
    } = {}
  ): Promise<Blob> {
    const payload = {
      text,
      voice_id: options.voiceId || undefined,
      speech_speed: options.speed ?? 1.0,
      language: options.language || 'en',
      model_id: options.modelId || undefined,
      voice_mode: 'standard',
    };

    const response = await apiClient.post('/speech/synthesize', payload, {
      responseType: 'blob',
      headers: {
        Accept: 'audio/mpeg, audio/wav, */*',
      },
    });

    return response.data;
  }

  /**
   * Play an audio Blob through HTML5 Audio element.
   */
  playAudioBlob(
    blob: Blob,
    options: {
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): HTMLAudioElement {
    this.stop();

    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.volume = options.volume ?? 1.0;

    audio.onplay = () => {
      if (options.onStart) options.onStart();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      this.currentAudio = null;
      if (options.onEnd) options.onEnd();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl);
      this.currentAudio = null;
      if (options.onError) options.onError(e);
    };

    this.currentAudio = audio;
    audio.play().catch((err) => {
      if (options.onError) options.onError(err);
    });

    return audio;
  }

  /**
   * Unified speech trigger: tries real backend ElevenLabs TTS API first;
   * seamlessly falls back to browser-native SpeechSynthesis on error/offline.
   */
  async speakAloud(
    text: string,
    options: {
      rate?: number;
      volume?: number;
      voiceId?: string | null;
      language?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): Promise<boolean> {
    const clean = text.trim();
    if (!clean) return false;

    try {
      if (options.onStart) options.onStart();
      const audioBlob = await this.synthesizeViaApi(clean, {
        voiceId: options.voiceId,
        speed: options.rate,
        language: options.language,
      });

      if (audioBlob && audioBlob.size > 0) {
        this.playAudioBlob(audioBlob, {
          volume: options.volume,
          onStart: options.onStart,
          onEnd: options.onEnd,
          onError: (audioErr) => {
            console.warn('Audio element error, falling back to browser synth:', audioErr);
            this.speak(clean, options);
          },
        });
        return true;
      }
    } catch (apiErr) {
      console.warn('Backend TTS synthesis failed, using browser speech synthesis fallback:', apiErr);
    }

    // Safe fallback to browser-native speech
    return this.speak(clean, options);
  }

  /**
   * Native browser SpeechSynthesis fallback.
   */
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
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
      return;
    }
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
      return;
    }
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Real ElevenLabs STT speech transcription API call.
   * Transcribes an audio Blob via POST /api/v1/speech/transcribe.
   */
  async transcribeAudioBlob(
    audioBlob: Blob,
    language: string = 'en'
  ): Promise<{ text: string; language: string; confidence: number; status: string }> {
    const formData = new FormData();
    const filename = audioBlob.type.includes('wav') ? 'recording.wav' : 'recording.webm';
    formData.append('audio_file', audioBlob, filename);
    formData.append('language_preference', language);

    const response = await apiClient.post<any>('/speech/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;
    return {
      text: data.transcribed_text || data.text || '',
      language: data.detected_language || data.language || language,
      confidence: data.confidence ?? 0.95,
      status: data.processing_status || data.status || 'completed',
    };
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
