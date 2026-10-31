export interface AccessibilitySettings {
  font_size: 'normal' | 'large' | 'xlarge';
  high_contrast: boolean;
  theme: 'light' | 'dark';
  reduced_motion: boolean;
  large_buttons?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferred_language: string;
  accessibility_settings: AccessibilitySettings;
  voice_consent?: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  preferred_language?: string;
  accessibility_preferences?: Partial<AccessibilitySettings>;
}

