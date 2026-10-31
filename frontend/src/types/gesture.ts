export interface GestureDefinition {
  id: string;
  label: string;
  category: string;
  default_phrase: string;
  current_phrase: string;
  description: string;
  icon: string;
  confidence_typical: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface GestureRecognitionResult {
  gesture_id: string;
  label: string;
  confidence: number;
  suggested_sentence: string;
  ai_suggestions?: string[];
  timestamp: string;
  status: 'recognized' | 'uncertain' | 'no_hand_detected';
  is_dynamic?: boolean;
  landmarks?: LandmarkPoint[];
  landmark_count?: number;
  description?: string;
  explanation?: string;
}

export interface GestureHistoryItem {
  history_id: string;
  gesture_id: string;
  label: string;
  confidence: number;
  suggested_text: string;
  status: string;
  is_dynamic?: boolean;
  timestamp: string;
}

export interface CameraState {
  isActive: boolean;
  hasPermission: boolean | null;
  error?: string | null;
  selectedDeviceId?: string;
}
