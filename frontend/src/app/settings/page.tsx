'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Globe,
  Volume2,
  Type,
  Eye,
  ShieldCheck,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Zap,
  HelpCircle,
  Keyboard,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useAppStore } from '@/store/useAppStore';
import preferencesService from '@/services/preferences.service';
import speechService from '@/services/speech.service';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import { VoiceOption, QuickPhrase } from '@/types';

export default function SettingsPage() {
  const {
    fontSize,
    setFontSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    volume,
    setVolume,
    selectedVoice,
    setSelectedVoice,
  } = useAppStore();

  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [interfaceLanguage, setInterfaceLanguage] = useState('en');

  // Privacy & Consent
  const [voiceConsentActive, setVoiceConsentActive] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Custom Phrases
  const [customPhrases, setCustomPhrases] = useState<QuickPhrase[]>([
    { id: 'cp_1', category: 'Personal', text: 'Please call my daughter.' },
    { id: 'cp_2', category: 'Needs', text: 'I would like some warm tea.' },
    { id: 'cp_3', category: 'Emergency', text: 'Could you adjust my pillow?' },
  ]);
  const [newPhraseText, setNewPhraseText] = useState('');
  const [newPhraseCategory, setNewPhraseCategory] = useState<QuickPhrase['category']>('Personal');

  useEffect(() => {
    speechService.getVoices().then(setAvailableVoices);
  }, []);

  const handleTestVoice = (text: string = 'Hello, this is your configured speech assistant voice.') => {
    speechService.speak(text, {
      rate: speechRate,
      volume,
      voiceId: selectedVoice,
      onStart: () => toast.info('Playing voice test...'),
      onError: () => toast.error('Speech synthesis not available.'),
    });
  };

  const handleAddPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhraseText.trim()) return;

    const newPhrase: QuickPhrase = {
      id: 'cp_' + Date.now(),
      category: newPhraseCategory,
      text: newPhraseText.trim(),
    };
    setCustomPhrases((prev) => [...prev, newPhrase]);
    setNewPhraseText('');
    toast.success(`Added quick phrase to ${newPhraseCategory}`);
  };

  const handleDeletePhrase = (id: string) => {
    setCustomPhrases((prev) => prev.filter((p) => p.id !== id));
    toast.info('Quick phrase removed.');
  };

  const handleToggleVoiceConsent = async () => {
    const next = !voiceConsentActive;
    await preferencesService.setVoiceCloningConsent(next);
    setVoiceConsentActive(next);
    if (next) {
      toast.success('Voice cloning consent recorded securely.');
    } else {
      toast.warning('Voice cloning consent revoked. Safety guard active.');
    }
  };

  const handleClearLocalData = () => {
    preferencesService.clearLocalData();
    setShowClearConfirm(false);
    toast.success('All local development caches and session tokens cleared.');
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      <AppSidebar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title="System Preferences & Accessibility"
          subtitle="Configure language models, voice synthesis, accessibility settings, and privacy consent."
          backHref="/dashboard"
        />

        {/* 1. Language Preferences */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-6 h-6 text-[#6651E8]" />
            <h3 className="text-xl font-black text-[#172554] dark:text-white">
              Language &amp; Localization
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Preferred Spoken Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  toast.success(`Language set to ${e.target.value}`);
                }}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Interface Language
              </label>
              <select
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px]"
              >
                <option value="en">English (US)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="es">Spanish (Español)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Speech Recognition Dialect
              </label>
              <select
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px]"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-IN">English (India)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 2. Voice & Speech Controls */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-6 h-6 text-[#6651E8]" />
              <h3 className="text-xl font-black text-[#172554] dark:text-white">
                Voice Synthesis &amp; Audio
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleTestVoice()}
              className="gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-[#6651E8]" />
              <span>Test Audio</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Synthesized Voice
              </label>
              <select
                value={selectedVoice || ''}
                onChange={(e) => {
                  setSelectedVoice(e.target.value || null);
                  toast.success('Voice model updated');
                }}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px]"
              >
                <option value="">System Default Voice</option>
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <span>Output Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6651E8]"
              />
            </div>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <span>Speech Rate ({speechRate.toFixed(2)}x)</span>
              <span className="text-[11px] font-semibold text-slate-400">Normal: 1.0x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6651E8]"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-1">
              <span>0.5x (Slow)</span>
              <span>1.0x (Standard)</span>
              <span>2.0x (Fast)</span>
            </div>
          </div>
        </Card>

        {/* 3. Accessibility & Keyboard Navigation */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Type className="w-6 h-6 text-[#6651E8]" />
              <h3 className="text-xl font-black text-[#172554] dark:text-white">
                Accessibility (WCAG AAA)
              </h3>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <Keyboard className="w-4 h-4" />
              <span>Keyboard Shortcuts</span>
            </button>
          </div>

          {showKeyboardHelp && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-2">
              <span className="font-bold block">Accessible Keyboard Navigation Guide:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">Tab</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">Shift+Tab</kbd>: Navigate through buttons and focus indicators.</li>
                <li><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">Enter</kbd>: Send typed message in composer or confirm selected candidate.</li>
                <li><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">Shift + Enter</kbd>: Insert a new line in the message composer.</li>
                <li><kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border">Esc</kbd>: Dismiss open confirmation dialogs or modals.</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="font-bold text-sm block mb-1">Text Scaling</span>
                <span className="text-xs text-slate-400">Current: {fontSize}</span>
              </div>
              <div className="flex gap-1.5 mt-3">
                {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition min-h-[40px] ${
                      fontSize === sz
                        ? 'bg-[#6651E8] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="font-bold text-sm block mb-1">High Contrast</span>
                <span className="text-xs text-slate-400">Yellow on Black WCAG AAA</span>
              </div>
              <Button
                variant={highContrast ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleHighContrast}
                className="mt-3 w-full"
              >
                {highContrast ? 'Contrast Enabled' : 'Enable Contrast'}
              </Button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <span className="font-bold text-sm block mb-1">Reduced Motion</span>
                <span className="text-xs text-slate-400">Minimizes screen transitions</span>
              </div>
              <Button
                variant={reducedMotion ? 'primary' : 'outline'}
                size="sm"
                onClick={toggleReducedMotion}
                className="mt-3 w-full"
              >
                {reducedMotion ? 'Motion Disabled' : 'Disable Motion'}
              </Button>
            </div>
          </div>
        </Card>

        {/* 4. Custom Phrases Management */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Plus className="w-6 h-6 text-[#6651E8]" />
            <h3 className="text-xl font-black text-[#172554] dark:text-white">
              Custom Quick Phrases
            </h3>
          </div>

          <form onSubmit={handleAddPhrase} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={newPhraseText}
                onChange={(e) => setNewPhraseText(e.target.value)}
                placeholder="Enter custom phrase (e.g. Please call my doctor)..."
                maxLength={120}
              />
            </div>
            <select
              value={newPhraseCategory}
              onChange={(e) => setNewPhraseCategory(e.target.value as any)}
              className="px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px]"
            >
              <option value="Basic">Basic</option>
              <option value="Needs">Needs</option>
              <option value="Emergency">Emergency</option>
              <option value="Feelings">Feelings</option>
              <option value="Social">Social</option>
              <option value="Personal">Personal</option>
            </select>
            <Button type="submit" size="md" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              <span>Add Phrase</span>
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {customPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    {phrase.category}
                  </span>
                  <p className="font-bold text-sm text-[#172554] dark:text-white mt-1">
                    "{phrase.text}"
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePhrase(phrase.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Remove phrase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* 5. Privacy, Voice Cloning Consent & Local Data */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <h3 className="text-xl font-black text-[#172554] dark:text-white">
              Privacy &amp; Voice Consent Controls
            </h3>
          </div>

          <div className="space-y-4">
            {/* Voice Cloning Consent Toggle */}
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-teal-900 dark:text-teal-200">
                  Voice Cloning Consent Status (SRC-07 / FR-013)
                </h4>
                <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                  Explicit authorization to synthesize personalized cloned voice models for confirmed speech.
                </p>
              </div>

              <Button
                variant={voiceConsentActive ? 'danger' : 'primary'}
                size="sm"
                onClick={handleToggleVoiceConsent}
                className="shrink-0"
              >
                {voiceConsentActive ? 'Revoke Consent' : 'Grant Consent'}
              </Button>
            </div>

            {/* Clear Local Data */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Clear Local Development Data
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Removes cached conversations, preferences, and session storage tokens from this browser.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 shrink-0"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>Clear Local Data</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Clear Confirmation Modal */}
        <ConfirmationDialog
          isOpen={showClearConfirm}
          title="Clear Local Demo Data?"
          description="This will reset all offline conversations, custom phrases, and preferences to default values. You will need to sign in again."
          confirmLabel="Clear All Data"
          cancelLabel="Cancel"
          onConfirm={handleClearLocalData}
          onCancel={() => setShowClearConfirm(false)}
        />
      </main>

      <MobileNavigation />
    </div>
  );
}
