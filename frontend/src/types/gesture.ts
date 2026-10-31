export interface GestureDefinition {
  id: string;
  label: string;
  phrase: string;
  icon: string;
  confidence: number;
  category?: 'affirmation' | 'negation' | 'need' | 'social';
}

export interface GestureRecognitionResult {
  gesture_id: string;
  label: string;
  confidence: number;
  suggested_sentence: string;
  timestamp: string;
  landmark_count?: number;
}

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean | null;
  error?: string | null;
  selectedDeviceId?: string;
}

