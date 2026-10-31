'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Check,
  Edit3,
  Sparkles,
  X,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Activity,
  Layers,
} from 'lucide-react';
import { GestureRecognitionResult } from '@/types';
import { Button } from './ui/Button';

interface GestureResultCardProps {
  result: GestureRecognitionResult | null;
  onConfirmAndSpeak: (sentence: string) => void;
  onSendToWorkspace?: (sentence: string) => void;
  onClear?: () => void;
  onRetry?: () => void;
}

export const GestureResultCard: React.FC<GestureResultCardProps> = ({
  result,
  onConfirmAndSpeak,
  onSendToWorkspace,
  onClear,
  onRetry,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSentence, setActiveSentence] = useState(result?.suggested_sentence || '');

  // Synchronize when result changes
  useEffect(() => {
    if (result) {
      setActiveSentence(result.suggested_sentence);
      setIsEditing(false);
    }
  }, [result]);

  if (!result) return null;

  const confidencePercentage = Math.round((result.confidence || 0.0) * 100);
  const isUncertain = result.status === 'uncertain' || result.confidence < 0.70;
  const isNoHand = result.status === 'no_hand_detected';

  // Confidence color
  const confidenceColor =
    confidencePercentage >= 80
      ? 'from-emerald-500 to-teal-500'
      : confidencePercentage >= 65
      ? 'from-amber-500 to-yellow-500'
      : 'from-rose-500 to-red-500';

  const handleSpeak = () => {
    if (!activeSentence.trim()) return;
    onConfirmAndSpeak(activeSentence.trim());
  };

  const handleWorkspaceSend = () => {
    if (!activeSentence.trim()) return;
    if (onSendToWorkspace) {
      onSendToWorkspace(activeSentence.trim());
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setActiveSentence(suggestion);
  };

  return (
    <div
      role="region"
      aria-label="Gesture recognition result and confirmation"
      aria-live="polite"
      className={`rounded-3xl border-2 p-6 shadow-md space-y-5 animate-in fade-in duration-200 ${
        isUncertain
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
          : 'bg-white dark:bg-slate-900 high-contrast:bg-black border-purple-200 dark:border-purple-900/80 high-contrast:border-yellow-400'
      }`}
    >
      {/* Header: Gesture Label, Status, and Confidence */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`p-3 rounded-2xl ${
              isUncertain
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200'
                : 'bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300'
            }`}
          >
            {isUncertain ? <AlertTriangle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
                {result.label}
              </h4>
              {result.is_dynamic && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  Dynamic Motion
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Confidence:{' '}
              <span
                className={`font-black ${
                  confidencePercentage >= 75
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : confidencePercentage >= 60
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {confidencePercentage}%
              </span>
              {result.landmark_count ? ` • ${result.landmark_count} Landmarks Tracked` : ''}
            </p>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#6651E8]"
            aria-label="Dismiss recognition result"
            title="Dismiss result"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Confidence Progress Meter */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`bg-gradient-to-r ${confidenceColor} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(confidencePercentage, 5)}%` }}
          />
        </div>
      </div>

      {/* Low-confidence / Uncertain Banner */}
      {isUncertain && (
        <div className="p-3.5 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Low confidence recognition ({confidencePercentage}%). Please hold your hand steady and retry.
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white font-bold text-xs hover:bg-amber-300 transition flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Sentence Box: Display or Edit */}
      {!isNoHand && (
        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Spoken Sentence To Confirm
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1 focus:outline-none"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit Sentence'}</span>
            </button>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={activeSentence}
              onChange={(e) => setActiveSentence(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-bold text-base focus:outline-none focus:border-[#6651E8]"
              autoFocus
              aria-label="Edit sentence before confirmation"
            />
          ) : (
            <p className="text-lg sm:text-xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
              "{activeSentence || result.suggested_sentence}"
            </p>
          )}
        </div>
      )}

      {/* AI Contextual Suggestions Pills */}
      {result.ai_suggestions && result.ai_suggestions.length > 0 && !isNoHand && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#6651E8]" />
            <span>AI Suggested Expansions (Select to use):</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {result.ai_suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition text-left ${
                  activeSentence === suggestion
                    ? 'bg-[#6651E8] text-white border-[#6651E8]'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                "{suggestion}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Strict Confirmation Gate Notice & Actions */}
      <div className="space-y-3 pt-1">
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Human confirmation required: Voice output will never speak automatically without explicit user confirmation.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleSpeak}
            disabled={!activeSentence.trim() || isNoHand}
            className="w-full sm:flex-1 gap-2.5 min-h-[54px] text-base font-bold shadow-md"
            aria-label="Confirm and speak sentence aloud"
          >
            <Volume2 className="w-5 h-5" />
            <span>Confirm & Speak Aloud</span>
          </Button>

          {onSendToWorkspace && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleWorkspaceSend}
              disabled={!activeSentence.trim() || isNoHand}
              className="w-full sm:w-auto gap-2 min-h-[54px]"
              title="Add this confirmed sentence to active conversation workspace"
              aria-label="Send to conversation workspace"
            >
              <MessageSquare className="w-5 h-5 text-[#6651E8]" />
              <span>Send to Chat</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestureResultCard;
