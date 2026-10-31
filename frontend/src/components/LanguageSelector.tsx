'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (langCode: string) => void;
  label?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  label = 'Language',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#6651E8]" />
          <span>{label}</span>
        </label>
      )}
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#6651E8] min-h-[48px]"
        aria-label="Select preferred language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name} ({lang.nativeName})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;

