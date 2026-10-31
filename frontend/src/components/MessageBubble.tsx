'use client';

import React from 'react';
import { Volume2, Sparkles, Video, User, Users, Check } from 'lucide-react';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSpeak }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} my-3 max-w-[85%] sm:max-w-[75%] ${
        isUser ? 'ml-auto' : 'mr-auto'
      }`}
    >
      {/* Sender label and metadata */}
      <div className="flex items-center gap-2 mb-1 px-1 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          {isUser ? (
            <>
              <User className="w-3.5 h-3.5 text-[#6651E8]" />
              <span>You (Assisted Speech)</span>
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Partner (Transcribed)</span>
            </>
          )}
        </span>

        {message.type === 'gesture_generated' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 text-[10px]">
            <Video className="w-3 h-3" />
            <span>Gesture Fused</span>
          </span>
        )}

        {message.type === 'ai_suggestion' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>AI Confirmed</span>
          </span>
        )}

        <span className="text-[11px] font-normal opacity-75">{message.timestamp}</span>
      </div>

      {/* Bubble container */}
      <div
        className={`relative p-4 sm:p-5 rounded-3xl text-base sm:text-lg font-medium leading-relaxed transition-all shadow-sm ${
          isUser
            ? 'bg-[#6651E8] text-white rounded-br-md high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-2 high-contrast:border-white'
            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border-2 border-slate-200 dark:border-slate-700 high-contrast:bg-black high-contrast:text-white high-contrast:border-yellow-400'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {/* Fused signals badge pill */}
        {message.fusedSignals && message.fusedSignals.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-white/20 dark:border-slate-700/60">
            {message.fusedSignals.map((sig, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white dark:text-slate-200 high-contrast:bg-black high-contrast:text-yellow-400"
              >
                {sig}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action footer */}
      {onSpeak && (
        <div className="flex items-center gap-2 mt-1 px-1">
          <button
            onClick={() => onSpeak(message.content)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#6651E8] dark:hover:text-purple-400 p-1 rounded-lg transition min-h-[36px]"
            title="Speak this message aloud"
            aria-label="Speak this message aloud"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Speak</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;

