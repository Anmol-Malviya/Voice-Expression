'use client';

import React, { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { VoiceOption } from '@/types';
import speechService from '@/services/speech.service';
import { Button } from './ui/Button';

interface VoiceControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
  onStopSpeaking: () => void;
  speechRate: number;
  onRateChange: (rate: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  selectedVoice: string | null;
  onVoiceChange: (voiceId: string) => void;
  sttError?: string | null;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  onToggleListening,
  isSpeaking,
  isPaused,
  onPauseSpeaking,
  onResumeSpeaking,
  onStopSpeaking,
  speechRate,
  onRateChange,
  volume,
  onVolumeChange,
  selectedVoice,
  onVoiceChange,
  sttError,
}) => {
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const isSttSupported = speechService.isSttSupported();

  useEffect(() => {
    speechService.getVoices().then(setAvailableVoices);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[#6651E8]" />
          <span>Speech & Audio Controls</span>
        </h3>
        {isListening && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            Mic Live
          </span>
        )}
      </div>

      {sttError && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sttError}</span>
        </div>
      )}

      {/* Main Microphone Action */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant={isListening ? 'danger' : 'primary'}
          size="lg"
          onClick={onToggleListening}
          className="flex-1 gap-3 min-h-[56px]"
          aria-label={isListening ? 'Stop listening to conversation partner' : 'Start listening to partner speech'}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Stop Partner Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Listen to Partner</span>
            </>
          )}
        </Button>

        {/* Playback action controls */}
        {isSpeaking && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={isPaused ? onResumeSpeaking : onPauseSpeaking}
              className="min-h-[56px] min-w-[56px] p-0"
              title={isPaused ? 'Resume speech' : 'Pause speech'}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onStopSpeaking}
              className="min-h-[56px] min-w-[56px] p-0 text-rose-600"
              title="Stop speech"
            >
              <Square className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Voice selection dropdown */}
      {availableVoices.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Synthesized Voice
          </label>
          <select
            value={selectedVoice || ''}
            onChange={(e) => onVoiceChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:border-[#6651E8] min-h-[48px]"
          >
            <option value="">Default System Voice</option>
            {availableVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Speech speed slider */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          <span>Speech Speed ({speechRate.toFixed(2)}x)</span>
          <span className="text-[11px] font-semibold text-slate-400">Normal: 1.0x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={speechRate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#6651E8]"
          aria-label="Speech speed slider"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
          <span>0.5x (Slow)</span>
          <span>1.0x</span>
          <span>2.0x (Fast)</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;

