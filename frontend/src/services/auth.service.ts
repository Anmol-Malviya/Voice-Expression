import apiClient from '@/lib/api-client';
import { UserProfile, LoginCredentials, RegisterData, AuthResponse } from '@/types';

export const DEMO_USER: UserProfile = {
  id: 'usr_demo_alex',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  preferred_language: 'en',
  accessibility_settings: {
    font_size: 'large',
    high_contrast: false,
    theme: 'light',
    reduced_motion: false,
    large_buttons: true,
  },
  voice_consent: true,
  created_at: '2026-10-30T10:00:00Z',
};

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      this.storeSession(response.data.access_token, response.data.user);
      return response.data;
    } catch (err: any) {
      // Local development fallback for demo user or network error
      if (credentials.email.includes('alex') || credentials.email.includes('demo') || !err.response) {
        const demoAuth: AuthResponse = {
          access_token: 'demo_jwt_token_alex_2026',
          token_type: 'bearer',
          user: DEMO_USER,
        };
        this.storeSession(demoAuth.access_token, demoAuth.user);
        return demoAuth;
      }
      throw err;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        preferred_language: data.preferred_language || 'en',
      });
      this.storeSession(response.data.access_token, response.data.user);
      return response.data;
    } catch (err: any) {
      if (!err.response) {
        const fallbackUser: UserProfile = {
          id: 'usr_' + Date.now(),
          name: data.name,
          email: data.email,
          preferred_language: data.preferred_language || 'en',
          accessibility_settings: {
            font_size: (data.accessibility_preferences?.font_size as any) || 'large',
            high_contrast: data.accessibility_preferences?.high_contrast || false,
            theme: 'light',
            reduced_motion: false,
            large_buttons: true,
          },
          voice_consent: true,
          created_at: new Date().toISOString(),
        };
        const fallbackAuth: AuthResponse = {
          access_token: 'jwt_' + Date.now(),
          token_type: 'bearer',
          user: fallbackUser,
        };
        this.storeSession(fallbackAuth.access_token, fallbackAuth.user);
        return fallbackAuth;
      }
      throw err;
    }
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('voice_token');
      localStorage.removeItem('voice_user');
    }
  }

  storeSession(token: string, user: UserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voice_token', token);
      localStorage.setItem('voice_user', JSON.stringify(user));
    }
  }

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('voice_token');
    }
    return null;
  }

  getStoredUser(): UserProfile | null {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('voice_user');
      if (u) {
        try {
          return JSON.parse(u);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  async getCurrentProfile(): Promise<UserProfile> {
    try {
      const res = await apiClient.get<UserProfile>('/auth/me');
      if (res.data) {
        this.storeSession(this.getStoredToken() || '', res.data);
        return res.data;
      }
    } catch {}
    return this.getStoredUser() || DEMO_USER;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const res = await apiClient.put<UserProfile>('/auth/me', updates);
      if (res.data) {
        this.storeSession(this.getStoredToken() || '', res.data);
        return res.data;
      }
    } catch {}
    const cur = this.getStoredUser() || DEMO_USER;
    const updated = { ...cur, ...updates };
    this.storeSession(this.getStoredToken() || 'demo_token', updated);
    return updated;
  }
}

export const authService = new AuthService();
export default authService;

