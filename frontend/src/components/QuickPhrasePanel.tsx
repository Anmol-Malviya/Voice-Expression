'use client';

import React, { useState } from 'react';
import { Volume2, Plus, Sparkles, AlertCircle, Heart, Users, CheckCircle, Hand } from 'lucide-react';
import { QuickPhrase } from '@/types';
import { DEFAULT_QUICK_PHRASES } from '@/lib/constants';

interface QuickPhrasePanelProps {
  onSelectPhrase: (text: string) => void;
  onSpeakPhrase?: (text: string) => void;
  customPhrases?: QuickPhrase[];
}

const CATEGORIES: { name: QuickPhrase['category']; icon: any }[] = [
  { name: 'Basic', icon: CheckCircle },
  { name: 'Needs', icon: Hand },
  { name: 'Emergency', icon: AlertCircle },
  { name: 'Feelings', icon: Heart },
  { name: 'Social', icon: Users },
];

export const QuickPhrasePanel: React.FC<QuickPhrasePanelProps> = ({
  onSelectPhrase,
  onSpeakPhrase,
  customPhrases = [],
}) => {
  const [activeCategory, setActiveCategory] = useState<QuickPhrase['category']>('Basic');

  const allPhrases = [...DEFAULT_QUICK_PHRASES, ...customPhrases];
  const filteredPhrases = allPhrases.filter((p) => p.category === activeCategory);

  return (
    <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6651E8]" />
          <span>Quick Communication Phrases</span>
        </h3>
        <span className="text-xs font-bold text-slate-400">1-Tap Insert</span>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Phrase Categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition min-h-[40px] ${
                isActive
                  ? 'bg-[#6651E8] text-white shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Phrases Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredPhrases.map((phrase) => (
          <div
            key={phrase.id}
            className="flex items-center justify-between p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 hover:border-[#6651E8] dark:hover:border-purple-400 bg-slate-50/50 dark:bg-slate-800/40 transition group"
          >
            <button
              onClick={() => onSelectPhrase(phrase.text)}
              className="flex-1 text-left font-bold text-sm sm:text-base text-[#172554] dark:text-white high-contrast:text-yellow-400 py-1 pr-2 min-h-[44px] flex items-center"
              title="Insert into composer"
            >
              {phrase.text}
            </button>

            {onSpeakPhrase && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeakPhrase(phrase.text);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-[#6651E8] hover:bg-white dark:hover:bg-slate-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                title="Speak this phrase"
                aria-label={`Speak ${phrase.text}`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickPhrasePanel;

