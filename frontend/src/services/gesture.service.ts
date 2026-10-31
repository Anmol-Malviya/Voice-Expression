import apiClient from '@/lib/api-client';
import {
  GestureRecognitionResult,
  GestureDefinition,
  GestureHistoryItem,
  LandmarkPoint,
} from '@/types';
import { GESTURE_DICTIONARY } from '@/lib/constants';

class GestureService {
  async startCamera(constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
    },
    audio: false,
  }): Promise<MediaStream> {
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access API is not available on this device or browser.');
    }
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  stopCamera(stream: MediaStream | null): void {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  captureFrameAsBase64(videoElement: HTMLVideoElement): string | null {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    // Returns data:image/jpeg;base64,...
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  async recognizeGesture(params: {
    imageBase64?: string;
    landmarks?: LandmarkPoint[];
    gestureName?: string;
    context?: string;
  }): Promise<GestureRecognitionResult> {
    try {
      const response = await apiClient.post<any>('/gesture/recognize', {
        image_data: params.imageBase64,
        landmarks: params.landmarks,
        gesture_name: params.gestureName,
        context: params.context,
        generate_suggestions: true,
      });

      if (response.data) {
        return {
          gesture_id: response.data.gesture_id,
          label: response.data.label,
          confidence: response.data.confidence,
          suggested_sentence: response.data.suggested_text,
          ai_suggestions: response.data.ai_suggestions || [],
          timestamp: response.data.timestamp || new Date().toLocaleTimeString(),
          status: response.data.status || 'recognized',
          is_dynamic: response.data.is_dynamic || false,
          landmarks: response.data.landmarks || undefined,
          landmark_count: response.data.landmark_count || (response.data.landmarks ? response.data.landmarks.length : 0),
          description: response.data.description,
          explanation: response.data.explanation,
        };
      }
    } catch (err) {
      console.warn('Backend gesture recognize fallback activated:', err);
    }

    // Local fallback if backend is unreachable
    const fallbackGesture = GESTURE_DICTIONARY.find(g => g.id === params.gestureName) || GESTURE_DICTIONARY[0];
    return {
      gesture_id: fallbackGesture.id,
      label: fallbackGesture.label,
      confidence: fallbackGesture.confidence,
      suggested_sentence: fallbackGesture.phrase,
      ai_suggestions: [fallbackGesture.phrase, `Please assist with: ${fallbackGesture.phrase}`],
      timestamp: new Date().toLocaleTimeString(),
      status: 'recognized',
      is_dynamic: fallbackGesture.id === 'wave',
      landmark_count: 21,
      description: fallbackGesture.description,
    };
  }

  async getVocabulary(): Promise<GestureDefinition[]> {
    try {
      const response = await apiClient.get<{ vocabulary: GestureDefinition[] }>('/gesture/vocabulary');
      if (response.data && response.data.vocabulary) {
        return response.data.vocabulary;
      }
    } catch (err) {
      console.warn('Using default local vocabulary fallback:', err);
    }

    return GESTURE_DICTIONARY.map(g => ({
      id: g.id,
      label: g.label,
      category: g.id === 'wave' ? 'dynamic' : 'static',
      default_phrase: g.phrase,
      current_phrase: g.phrase,
      description: g.description,
      icon: g.icon,
      confidence_typical: g.confidence,
    }));
  }

  async updateMappings(mappings: Record<string, string>): Promise<GestureDefinition[]> {
    try {
      const response = await apiClient.put<{ vocabulary: GestureDefinition[] }>('/gesture/mappings', {
        mappings,
      });
      if (response.data && response.data.vocabulary) {
        return response.data.vocabulary;
      }
    } catch (err) {
      console.warn('Failed to persist custom mappings to backend:', err);
    }
    return this.getVocabulary();
  }

  async getHistory(): Promise<GestureHistoryItem[]> {
    try {
      const response = await apiClient.get<{ history: GestureHistoryItem[] }>('/gesture/history');
      if (response.data && response.data.history) {
        return response.data.history;
      }
    } catch (err) {
      console.warn('Failed to fetch gesture history:', err);
    }
    return [];
  }

  getWebSocketUrl(): string {
    if (typeof window === 'undefined') return 'ws://localhost:8000/ws/gesture';
    const envWs = process.env.NEXT_PUBLIC_WS_URL;
    if (envWs) return `${envWs}/ws/gesture`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = process.env.NODE_ENV === 'production' ? '' : ':8000';
    return `${protocol}//${host}${port}/ws/gesture`;
  }
}

export const gestureService = new GestureService();
export default gestureService;
