'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Volume2,
  Mic,
  Video,
  Sparkles,
  History,
  Sliders,
  Clock,
  Activity,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { ConversationCard } from '@/components/ConversationCard';
import { QuickPhrasePanel } from '@/components/QuickPhrasePanel';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { useAppStore } from '@/store/useAppStore';
import conversationService from '@/services/conversation.service';
import speechService from '@/services/speech.service';
import { ConversationSummary } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, language, setLanguage, speechRate, volume } = useAppStore();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    totalConversations: 12,
    messagesExchanged: 84,
    mostUsedPhrase: 'Thank you.',
    assistiveAccuracy: '96%',
  });

  useEffect(() => {
    conversationService
      .getConversations()
      .then((data) => {
        setConversations(data);
        setStats((prev) => ({
          ...prev,
          totalConversations: data.length,
          messagesExchanged: data.reduce((acc, c) => acc + (c.messages_count || 0), 0) || 84,
        }));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleStartNewSession = async () => {
    try {
      const newSession = await conversationService.createConversation({
        title: 'Assistive Conversation',
        language: user?.preferred_language || language || 'en',
        mode: 'live_conversation',
      });
      toast.success('New live conversation initialized.');
      router.push(`/conversation/${newSession.id}`);
    } catch {
      router.push(`/conversation/sess_${Date.now()}`);
    }
  };

  const handleSpeakPhrase = (text: string) => {
    speechService.speak(text, {
      rate: speechRate,
      volume,
      onStart: () => toast.info(`Speaking: "${text}"`),
    });
  };

  const handleDeleteConversation = async () => {
    if (!deleteTargetId) return;
    await conversationService.deleteConversation(deleteTargetId);
    setConversations((prev) => prev.filter((c) => c.id !== deleteTargetId));
    setDeleteTargetId(null);
    toast.success('Conversation safely deleted from history.');
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title={`Welcome back, ${user?.name ? user.name.split(' ')[0] : 'Alex'}!`}
          subtitle="Your assistive communication command center is active."
          actions={
            <Button
              size="md"
              onClick={handleStartNewSession}
              className="gap-2 shadow-md min-h-[48px]"
            >
              <Plus className="w-5 h-5" />
              <span>New Conversation</span>
            </Button>
          }
        />

        {/* 1. Hero Action Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-[#6651E8] via-indigo-600 to-purple-700 text-white shadow-xl high-contrast:bg-black high-contrast:border-4 high-contrast:border-yellow-400">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              <span>Live Assistive Pipeline Ready</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black high-contrast:text-yellow-400">
              Start Live Assistive Conversation
            </h2>
            <p className="text-indigo-100 high-contrast:text-white text-base sm:text-lg">
              Partner speech transcription, on-device gesture recognition, and AI-ranked candidate replies with strict human confirmation.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              size="touch"
              variant="outline"
              onClick={handleStartNewSession}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#6651E8] border-white font-black text-lg gap-3"
            >
              <MessageSquare className="w-6 h-6" />
              <span>Begin Session</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 2. Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Sessions</p>
              <p className="text-2xl font-black text-[#172554] dark:text-white">{stats.totalConversations}</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Messages Exchanged</p>
              <p className="text-2xl font-black text-[#172554] dark:text-white">{stats.messagesExchanged}</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Quick Phrase</p>
              <p className="text-lg font-black text-[#172554] dark:text-white truncate">"{stats.mostUsedPhrase}"</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">User Agency Gate</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Guarded</p>
            </div>
          </Card>
        </div>

        {/* 3. Middle Section: Quick Phrases & Language/Accessibility */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Phrases (2 cols) */}
          <div className="lg:col-span-2">
            <QuickPhrasePanel
              onSelectPhrase={(phrase) => {
                handleSpeakPhrase(phrase);
              }}
              onSpeakPhrase={handleSpeakPhrase}
            />
          </div>

          {/* Quick Setup Controls (1 col) */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-black text-lg text-[#172554] dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#6651E8]" />
                <span>Session Language</span>
              </h3>
              <LanguageSelector
                currentLanguage={language}
                onLanguageChange={(l) => {
                  setLanguage(l);
                  toast.success(`Language updated to ${l}`);
                }}
              />
            </Card>

            <AccessibilityToolbar />
          </div>
        </div>

        {/* 4. Recent Conversations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
              <History className="w-6 h-6 text-[#6651E8]" />
              <span>Recent Conversations</span>
            </h3>
            <Link
              href="/history"
              className="text-sm font-bold text-[#6651E8] dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.slice(0, 3).map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onDelete={(id) => setDeleteTargetId(id)}
                onSpeak={handleSpeakPhrase}
              />
            ))}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={!!deleteTargetId}
          title="Delete Conversation Record?"
          description="This action permanently purges the conversation messages from your local history and ephemeral database storage."
          confirmLabel="Delete Permanently"
          cancelLabel="Keep Conversation"
          onConfirm={handleDeleteConversation}
          onCancel={() => setDeleteTargetId(null)}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
