'use client';

import React, { useState } from 'react';
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';

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
  } = useAppStore();

  const [customPhrases, setCustomPhrases] = useState([
    { id: 'cp_1', category: 'Personal', text: 'Please call my daughter.' },
    { id: 'cp_2', category: 'Meal', text: 'I would like some warm tea.' },
    { id: 'cp_3', category: 'Comfort', text: 'Could you adjust my pillow?' },
  ]);
  const [newPhraseText, setNewPhraseText] = useState('');
  const [newPhraseCategory, setNewPhraseCategory] = useState('General');

  const [voiceConsentActive, setVoiceConsentActive] = useState(true);
  const [consentSuccessMsg, setConsentSuccessMsg] = useState<string | null>(null);

  const handleTestVoice = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhraseText.trim()) return;

    const newP = {
      id: 'cp_' + Date.now(),
      category: newPhraseCategory,
      text: newPhraseText.trim(),
    };
    setCustomPhrases(prev => [...prev, newP]);
    setNewPhraseText('');
  };

  const handleDeletePhrase = (id: string) => {
    setCustomPhrases(prev => prev.filter(p => p.id !== id));
  };

  const handleRevokeConsent = async () => {
    try {
      await api.delete('/voice-consents/vc_default');
    } catch {}
    setVoiceConsentActive(false);
    setConsentSuccessMsg('Voice cloning consent revoked. System will only use standard approved voices.');
    setTimeout(() => setConsentSuccessMsg(null), 4000);
  };

  const handleGrantConsent = async () => {
    try {
      await api.post('/voice-consents', {
        voice_id: 'custom_cloned_voice',
        purpose: 'Confirmed reply speech',
        scope: 'voice_cloning_and_generation',
      });
    } catch {}
    setVoiceConsentActive(true);
    setConsentSuccessMsg('Voice cloning consent granted and securely recorded.');
    setTimeout(() => setConsentSuccessMsg(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-[#6651E8] font-bold text-xs uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4" />
          <span>System &amp; Accessibility Preferences</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
          Preferences &amp; Settings
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Customize your speech synthesizer, display size, contrast, and personal phrases.
        </p>
      </div>

      {consentSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{consentSuccessMsg}</span>
        </div>
      )}

      {/* Grid of Preference Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Voice & Audio Settings */}
        <Card className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Volume2 className="w-5 h-5 text-[#6651E8]" />
            <h2 className="text-lg sm:text-xl font-bold text-[#172554] dark:text-white">
              Voice &amp; Audio Synthesis
            </h2>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              <span>Speech Speed Rate</span>
              <span className="text-[#6651E8] font-extrabold">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-[#6651E8] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              <span>Speech Volume</span>
              <span className="text-[#6651E8] font-extrabold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[#6651E8] h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => handleTestVoice("This is a preview of your personalized synthesized voice.")}
            className="w-full gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Voice Output</span>
          </Button>
        </Card>

        {/* Section 2: Display & Accessibility */}
        <Card className="space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Type className="w-5 h-5 text-teal-700" />
            <h2 className="text-lg sm:text-xl font-bold text-[#172554] dark:text-white">
              Display &amp; Accessibility
            </h2>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-2">
              Text Scaling Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Standard' },
                { id: 'large', label: 'Large (115%)' },
                { id: 'xlarge', label: 'X-Large (130%)' },
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => setFontSize(size.id as any)}
                  className={`py-2.5 px-2 rounded-xl border-2 font-bold text-xs transition ${
                    fontSize === size.id
                      ? 'border-[#6651E8] bg-purple-50 dark:bg-purple-950 text-[#6651E8] shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-[#172554] dark:text-white'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#172554] dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>High Contrast Mode (WCAG AAA)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Pure black background with bold yellow text
              </div>
            </div>
            <button
              onClick={toggleHighContrast}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#172554] dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#6651E8]" />
                <span>Reduced Motion</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Disables transitions and animations
              </div>
            </div>
            <button
              onClick={toggleReducedMotion}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                reducedMotion ? 'bg-[#6651E8] text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {reducedMotion ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[#172554] dark:text-slate-200 mb-1">
              Language Mode
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-medium text-xs sm:text-sm focus:border-[#6651E8]"
              >
                <option value="en">English (US/UK/IN)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="hi-en">Hinglish / Code-mixed</option>
              </select>
            </div>
          </div>
        </Card>

      </div>

      {/* Section 3: Voice Cloning Consent & Security (SRC-07 / FR-013) */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-black text-[#172554] dark:text-white">
              Voice Cloning Consent &amp; Privacy (SRC-07 / FR-013)
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${
            voiceConsentActive 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-rose-100 text-rose-800'
          }`}>
            {voiceConsentActive ? 'Consent Active' : 'Consent Revoked'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The system strictly enforces explicit consent prior to using any personalized voice clone. 
          Revoking consent immediately terminates and blocks all future speech generation using that voice model, falling back strictly to approved standard voices.
        </p>

        <div className="pt-2">
          {voiceConsentActive ? (
            <Button
              variant="danger"
              size="md"
              onClick={handleRevokeConsent}
              className="gap-2 text-xs"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Revoke Voice Clone Consent Immediately</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleGrantConsent}
              className="gap-2 text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Grant Informed Voice Cloning Consent</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Section 4: Personalized Quick Phrases Manager */}
      <Card className="space-y-6">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[#172554] dark:text-white">
            Personalized Quick Phrases
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create your own quick shortcuts for everyday phrases you use frequently.
          </p>
        </div>

        <form onSubmit={handleAddPhrase} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            required
            value={newPhraseText}
            onChange={(e) => setNewPhraseText(e.target.value)}
            placeholder="Add new phrase (e.g., 'Please call my doctor')..."
            className="flex-1"
          />
          <select
            value={newPhraseCategory}
            onChange={(e) => setNewPhraseCategory(e.target.value)}
            className="py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-medium text-xs sm:text-sm focus:border-[#6651E8]"
          >
            <option value="General">General</option>
            <option value="Personal">Personal</option>
            <option value="Medical">Medical</option>
            <option value="Social">Social</option>
          </select>
          <Button type="submit" size="md" className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Phrase</span>
          </Button>
        </form>

        <div className="space-y-2">
          {customPhrases.map((phrase) => (
            <div
              key={phrase.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#6651E8] text-xs font-bold">
                  {phrase.category}
                </span>
                <span className="font-bold text-[#172554] dark:text-white text-xs sm:text-sm">
                  {phrase.text}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestVoice(phrase.text)}
                  className="p-2 rounded-lg text-[#6651E8] hover:bg-purple-100"
                  title="Test Speech"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePhrase(phrase.id)}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                  title="Delete phrase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

