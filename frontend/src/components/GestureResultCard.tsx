'use client';

import React, { useState } from 'react';
import { Volume2, Check, Edit3, Sparkles, X, ShieldAlert } from 'lucide-react';
import { GestureRecognitionResult } from '@/types';
import { Button } from './ui/Button';

interface GestureResultCardProps {
  result: GestureRecognitionResult | null;
  onConfirmAndSpeak: (sentence: string) => void;
  onClear?: () => void;
}

export const GestureResultCard: React.FC<GestureResultCardProps> = ({
  result,
  onConfirmAndSpeak,
  onClear,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(result?.suggested_sentence || '');

  // Synchronize when result changes
  React.useEffect(() => {
    if (result) {
      setEditedText(result.suggested_sentence);
      setIsEditing(false);
    }
  }, [result]);

  if (!result) return null;

  const confidencePercentage = Math.round((result.confidence || 0.9) * 100);

  const handleSpeak = () => {
    onConfirmAndSpeak(isEditing ? editedText : result.suggested_sentence);
  };

  return (
    <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-purple-200 dark:border-purple-900/80 high-contrast:border-yellow-400 p-6 shadow-md space-y-5 animate-in fade-in duration-200">
      {/* Header with Gesture Label and Confidence */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
                {result.label}
              </h4>
              <p className="text-xs font-semibold text-slate-400">
                Confidence: {confidencePercentage}%
              </p>
            </div>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Dismiss result"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confidence Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#6651E8] to-purple-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${confidencePercentage}%` }}
        />
      </div>

      {/* Sentence Box: Display or Edit */}
      <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Suggested Speech Sentence
          </span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Sentence'}</span>
          </button>
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-bold text-base focus:outline-none focus:border-[#6651E8]"
            autoFocus
          />
        ) : (
          <p className="text-lg sm:text-xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
            "{result.suggested_sentence}"
          </p>
        )}
      </div>

      {/* Strict Confirmation Gate Notice & Speak Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-slate-500 flex items-center gap-1.5 text-center sm:text-left">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Strict Confirmation: requires your tap before voice synthesizes.</span>
        </p>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSpeak}
          className="w-full sm:w-auto gap-3 min-h-[56px] px-8"
        >
          <Volume2 className="w-5 h-5" />
          <span>Confirm & Speak Aloud</span>
        </Button>
      </div>
    </div>
  );
};

export default GestureResultCard;

