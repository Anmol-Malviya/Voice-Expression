import apiClient from '@/lib/api-client';
import { UserPreferences, QuickPhrase } from '@/types';
import { DEFAULT_QUICK_PHRASES } from '@/lib/constants';

const PREFS_STORAGE_KEY = 'voice_expression_preferences';

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  interface_language: 'en',
  speech_language: 'en-US',
  accessibility: {
    font_size: 'large',
    high_contrast: false,
    theme: 'light',
    reduced_motion: false,
    large_buttons: true,
  },
  speech: {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voiceId: null,
    provider: 'browser',
  },
  privacy: {
    history_retention_days: 30,
    ephemeral_only: false,
    voice_cloning_consent: true,
  },
  custom_phrases: DEFAULT_QUICK_PHRASES,
};

class PreferencesService {
  getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PREFERENCES;
  }

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));

    // Async sync to backend if logged in
    apiClient.put('/preferences', updated).catch(() => {});
    return updated;
  }

  clearLocalData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFS_STORAGE_KEY);
      localStorage.removeItem('voice_conversations_cache');
      localStorage.removeItem('voice_token');
      localStorage.removeItem('voice_user');
    }
  }

  async setVoiceCloningConsent(consent: boolean): Promise<boolean> {
    const prefs = this.getPreferences();
    prefs.privacy.voice_cloning_consent = consent;
    this.savePreferences(prefs);

    try {
      if (consent) {
        await apiClient.post('/voice-consents', {
          voice_id: 'cloned_voice_primary',
          purpose: 'Confirmed reply speech generation',
          scope: 'voice_cloning_and_generation',
        });
      } else {
        await apiClient.delete('/voice-consents/vc_default');
      }
    } catch {}

    return consent;
  }
}

export const preferencesService = new PreferencesService();
export default preferencesService;

