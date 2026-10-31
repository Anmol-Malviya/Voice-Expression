'use client';

import React from 'react';
import { Type, Eye, Sun, Moon, Zap, Volume2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export const AccessibilityToolbar: React.FC = () => {
  const {
    fontSize,
    cycleFontSize,
    highContrast,
    toggleHighContrast,
    theme,
    toggleTheme,
    reducedMotion,
    toggleReducedMotion,
  } = useAppStore();

  const handleTestAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Accessibility audio preview is active.');
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      role="region"
      aria-label="Accessibility quick controls"
      className="p-4 rounded-3xl bg-white dark:bg-slate-900 high-contrast:bg-black border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 shadow-sm space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Accessibility Shortcuts
        </span>
        <button
          onClick={handleTestAudio}
          className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1"
          title="Test speech audio"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Test Audio</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" suppressHydrationWarning>
        {/* Text size button */}
        <button
          onClick={cycleFontSize}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black min-h-[48px] transition"
          title={`Cycle text size (currently ${fontSize})`}
          aria-label={`Cycle font size. Current is ${fontSize}`}
          suppressHydrationWarning
        >
          <Type className="w-4 h-4 text-purple-600" />
          <span className="capitalize" suppressHydrationWarning>{fontSize}</span>
        </button>

        {/* High contrast button */}
        <button
          onClick={toggleHighContrast}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-black min-h-[48px] transition ${
            highContrast
              ? 'bg-yellow-400 text-black border-yellow-500 font-black'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle High Contrast Mode"
          aria-pressed={highContrast}
          suppressHydrationWarning
        >
          <Eye className="w-4 h-4 text-amber-500" />
          <span>Contrast</span>
        </button>

        {/* Theme button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black min-h-[48px] transition"
          title={`Switch theme (currently ${theme})`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Reduced motion button */}
        <button
          onClick={toggleReducedMotion}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-black min-h-[48px] transition ${
            reducedMotion
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Reduced Motion"
          aria-pressed={reducedMotion}
        >
          <Zap className="w-4 h-4 text-teal-500" />
          <span>Motion {reducedMotion ? 'Off' : 'On'}</span>
        </button>
      </div>
    </div>
  );
};

export default AccessibilityToolbar;

