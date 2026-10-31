'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Calendar, Trash2, ArrowRight, Volume2 } from 'lucide-react';
import { ConversationSummary } from '@/types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface ConversationCardProps {
  conversation: ConversationSummary;
  onDelete?: (id: string) => void;
  onSpeak?: (text: string) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onDelete,
  onSpeak,
}) => {
  return (
    <Card className="hover:border-[#6651E8] transition-all hover:shadow-md flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6651E8] dark:text-purple-300">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 group-hover:text-[#6651E8] transition">
              {conversation.title}
            </h3>
          </div>

          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {conversation.language || 'English'}
          </span>
        </div>

        {conversation.last_message_preview && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 italic mb-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            "{conversation.last_message_preview}"
          </p>
        )}

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {conversation.date} {conversation.time ? `• ${conversation.time}` : ''}
          </span>
          <span>•</span>
          <span>{conversation.messages_count} messages</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1">
          {onSpeak && conversation.last_message_preview && (
            <button
              onClick={() => onSpeak(conversation.last_message_preview!)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#6651E8] min-h-[44px] min-w-[44px] flex items-center justify-center transition"
              title="Speak last message"
              aria-label="Speak last message"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(conversation.id)}
              className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 min-h-[44px] min-w-[44px] flex items-center justify-center transition"
              title="Delete conversation"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <Link href={`/conversation/${conversation.id}`}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold">
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default ConversationCard;

