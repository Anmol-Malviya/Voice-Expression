'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Volume2, X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface MessageComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: (text: string) => void;
  onSpeak?: (text: string) => void;
  onClarify?: () => void;
  isClarifying?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  onSpeak,
  onClarify,
  isClarifying = false,
  placeholder = 'Type your message or click a quick phrase below...',
  disabled = false,
  maxLength = 500,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value.trim());
      }
    }
  };

  const handleClear = () => {
    onChange('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSpeakClick = () => {
    if (value.trim() && onSpeak) {
      onSpeak(value.trim());
    }
  };

  const handleSendClick = () => {
    if (value.trim()) {
      onSend(value.trim());
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-300 dark:border-slate-700 high-contrast:border-yellow-400 p-4 shadow-sm focus-within:border-[#6651E8] focus-within:ring-4 focus-within:ring-[#6651E8]/20 transition-all">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className="w-full resize-none bg-transparent text-[#172554] dark:text-white high-contrast:text-yellow-400 text-lg sm:text-xl font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[90px]"
          aria-label="Message composer input"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition"
            title="Clear text"
            aria-label="Clear text input"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Composer toolbar */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>
            {value.length} / {maxLength}
          </span>
          <span className="hidden sm:inline">• Press Enter to send, Shift+Enter for new line</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onClarify && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClarify}
              disabled={!value.trim() || disabled || isClarifying}
              className="gap-2 min-h-[48px] border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              title="Generate alternative assistive phrasings using AI"
            >
              {isClarifying ? (
                <Loader2 className="w-4 h-4 text-[#6651E8] animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#6651E8]" />
              )}
              <span>AI Suggestions</span>
            </Button>
          )}

          {onSpeak && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleSpeakClick}
              disabled={!value.trim() || disabled}
              className="gap-2 min-h-[48px]"
              title="Speak typed message"
            >
              <Volume2 className="w-5 h-5 text-[#6651E8]" />
              <span className="hidden sm:inline">Speak Out Loud</span>
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSendClick}
            disabled={!value.trim() || disabled}
            className="gap-2 min-h-[48px] px-6"
            title="Send message to conversation"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
