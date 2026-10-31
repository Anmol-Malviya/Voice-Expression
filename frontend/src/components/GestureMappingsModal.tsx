'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, X, Info, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { GestureDefinition } from '@/types';
import gestureService from '@/services/gesture.service';
import { toast } from 'sonner';

interface GestureMappingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingsUpdated?: (updatedVocab: GestureDefinition[]) => void;
}

export const GestureMappingsModal: React.FC<GestureMappingsModalProps> = ({
  isOpen,
  onClose,
  onMappingsUpdated,
}) => {
  const [vocabulary, setVocabulary] = useState<GestureDefinition[]>([]);
  const [editedPhrases, setEditedPhrases] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVocabulary();
    }
  }, [isOpen]);

  const loadVocabulary = async () => {
    setIsLoading(true);
    try {
      const vocab = await gestureService.getVocabulary();
      setVocabulary(vocab);
      const initial: Record<string, string> = {};
      vocab.forEach((item) => {
        initial[item.id] = item.current_phrase || item.default_phrase;
      });
      setEditedPhrases(initial);
    } catch (err) {
      toast.error('Failed to load gesture vocabulary.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhraseChange = (id: string, value: string) => {
    setEditedPhrases((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleResetDefaults = () => {
    const reset: Record<string, string> = {};
    vocabulary.forEach((item) => {
      reset[item.id] = item.default_phrase;
    });
    setEditedPhrases(reset);
    toast.info('Reset to default communication shortcut phrases.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await gestureService.updateMappings(editedPhrases);
      setVocabulary(updated);
      if (onMappingsUpdated) {
        onMappingsUpdated(updated);
      }
      toast.success('Custom gesture mappings updated successfully!');
      onClose();
    } catch (err) {
      toast.error('Failed to save gesture mappings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gesture-mappings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#6651E8] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="gesture-mappings-title"
                className="text-lg font-black text-[#172554] dark:text-white high-contrast:text-yellow-400"
              >
                Customize Gesture Communication Shortcuts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your personalized speech sentence shortcuts for each gesture.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Callout */}
        <div className="px-6 py-3 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
          <Info className="w-4 h-4 text-[#6651E8] shrink-0 mt-0.5" />
          <span>
            <strong>Communication Notice:</strong> These are configurable non-verbal shortcuts, not complete universal sign language translations. Customize what each movement means to communicate your personal daily needs.
          </span>
        </div>

        {/* Vocabulary List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              Loading gesture vocabulary...
            </div>
          ) : (
            vocabulary.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label={item.label}>
                      {item.icon}
                    </span>
                    <div>
                      <span className="font-extrabold text-sm text-[#172554] dark:text-white">
                        {item.label}
                      </span>
                      <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 max-w-[200px] text-right truncate">
                    {item.description}
                  </span>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor={`gesture-input-${item.id}`}
                    className="text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    Mapped Speech Phrase
                  </label>
                  <input
                    id={`gesture-input-${item.id}`}
                    type="text"
                    value={editedPhrases[item.id] || ''}
                    onChange={(e) => handlePhraseChange(item.id, e.target.value)}
                    placeholder={item.default_phrase}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#172554] dark:text-white text-sm font-semibold focus:outline-none focus:border-[#6651E8]"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto gap-2 text-xs font-bold text-slate-600"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none gap-2 min-h-[46px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Mappings'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestureMappingsModal;

