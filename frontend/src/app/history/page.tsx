'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Download,
  Trash2,
  Volume2,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Filter,
  ArrowRight,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { EmptyState } from '@/components/EmptyState';
import conversationService from '@/services/conversation.service';
import speechService from '@/services/speech.service';
import { ConversationSummary } from '@/types';

export default function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    conversationService.getConversations().then((data) => {
      setConversations(data);
      if (data.length > 0) setSelectedConversation(data[0]);
    });
  }, []);

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message_preview && c.last_message_preview.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLanguage = languageFilter === 'all' || c.language.toLowerCase() === languageFilter.toLowerCase();
    return matchesSearch && matchesLanguage;
  });

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await conversationService.deleteConversation(deleteTargetId);
    setConversations((prev) => prev.filter((c) => c.id !== deleteTargetId));
    if (selectedConversation?.id === deleteTargetId) {
      setSelectedConversation(conversations.find((c) => c.id !== deleteTargetId) || null);
    }
    setDeleteTargetId(null);
    toast.success('Conversation transcript permanently deleted.');
  };

  const handleExport = (conv: ConversationSummary) => {
    conversationService.exportConversation(conv.title, [
      { sender: 'partner', text: 'Hello! How are you feeling today?', time: '11:15' },
      { sender: 'user', text: conv.last_message_preview || 'Yes, I am feeling well.', time: '11:16' },
    ]);
    toast.success(`Exported transcript: ${conv.title}.txt`);
  };

  const handleSpeak = (text: string) => {
    speechService.speak(text, {
      onStart: () => toast.info(`Speaking: "${text}"`),
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      <AppSidebar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title="Conversation History & Logs"
          subtitle="Search, review, export, or permanently delete recorded assistive conversations."
          backHref="/dashboard"
          actions={
            <Link href="/conversation/new">
              <Button size="md" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>New Session</span>
              </Button>
            </Link>
          }
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by title or message text..."
              className="pl-11 min-h-[48px]"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold min-h-[48px] w-full sm:w-auto"
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* Master / Detail or Grid Layout */}
        {filteredConversations.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Conversations Found"
            description="No conversation logs match your search criteria. You can start a new live session at any time."
            actionLabel="Start New Conversation"
            onAction={() => (window.location.href = '/conversation/new')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List Column (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {filteredConversations.length} Sessions Available
              </span>

              {filteredConversations.map((conv) => {
                const isSelected = selectedConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#6651E8] bg-purple-50/50 dark:bg-purple-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-extrabold text-base text-[#172554] dark:text-white group-hover:text-[#6651E8] transition">
                        {conv.title}
                      </h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {conv.language}
                      </span>
                    </div>

                    {conv.last_message_preview && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic mb-2">
                        "{conv.last_message_preview}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {conv.date} {conv.time ? `• ${conv.time}` : ''}
                      </span>
                      <span>{conv.messages_count} messages</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail Column (7 cols) */}
            <div className="lg:col-span-7">
              {selectedConversation ? (
                <Card className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-2xl font-black text-[#172554] dark:text-white">
                        {selectedConversation.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Recorded: {selectedConversation.date} {selectedConversation.time || ''} • Language: {selectedConversation.language}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(selectedConversation)}
                        className="gap-1.5"
                        title="Download text transcript"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTargetId(selectedConversation.id)}
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Simulated Transcript Messages */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Transcript Log
                    </span>

                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-bold text-teal-700 dark:text-teal-400">Partner (STT):</span>
                          <span>11:15 AM</span>
                        </div>
                        <p className="font-medium text-sm text-[#172554] dark:text-white">
                          "Hello! How are you feeling today?"
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-bold text-[#6651E8] dark:text-purple-300">You (Synthesized Speech):</span>
                          <span>11:16 AM</span>
                        </div>
                        <p className="font-medium text-sm text-[#172554] dark:text-white">
                          "{selectedConversation.last_message_preview || 'I am doing well, thank you.'}"
                        </p>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleSpeak(selectedConversation.last_message_preview || 'I am doing well, thank you.')}
                            className="text-xs font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Replay Audio</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>FR-016 compliant data purge guarantee</span>
                    </span>

                    <Link href={`/conversation/${selectedConversation.id}`}>
                      <Button size="md" className="gap-2">
                        <span>Reopen in Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Select a Conversation"
                  description="Choose a conversation from the left to inspect its messages, replay speech, or export the transcript."
                />
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationDialog
          isOpen={!!deleteTargetId}
          title="Delete Conversation Record?"
          description="Are you sure you want to delete this transcript? This action permanently purges the stored dialogue from local history and ephemeral database storage."
          confirmLabel="Permanently Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTargetId(null)}
        />
      </main>

      <MobileNavigation />
    </div>
  );
}
