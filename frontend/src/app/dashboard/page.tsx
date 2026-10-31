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
  ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';

const DEFAULT_QUICK_PHRASES = [
  { id: '1', category: 'Urgent', text: 'I need help.', color: 'border-red-500 bg-red-50 dark:bg-red-950/30' },
  { id: '2', category: 'General', text: 'Please wait.', color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  { id: '3', category: 'Need', text: 'I need water.', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  { id: '4', category: 'Health', text: 'I am not feeling well.', color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' },
  { id: '5', category: 'Social', text: 'Thank you.', color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
  { id: '6', category: 'Clarify', text: 'Please repeat.', color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
  { id: '7', category: 'Answer', text: 'Yes.', color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/30' },
  { id: '8', category: 'Answer', text: 'No.', color: 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' },
  { id: '9', category: 'General', text: 'I want to go home.', color: 'border-slate-500 bg-slate-50 dark:bg-slate-800' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [sessions, setSessions] = useState([
    { id: 'sess_1', title: 'Consultation with Caregiver', messages_count: 8, updated_at: '10 mins ago' },
    { id: 'sess_2', title: 'Family Dinner Discussion', messages_count: 14, updated_at: 'Yesterday' },
  ]);
  const [lastSpoken, setLastSpoken] = useState('');

  useEffect(() => {
    api.get('/sessions')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSpeakPhrase = (text: string) => {
    setLastSpoken(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartSession = async () => {
    try {
      const res = await api.post('/sessions', {
        title: 'Live Conversation Session',
        language: user?.preferred_language || 'en',
        mode: 'live_conversation',
      });
      router.push(`/conversation/${res.data.session_id}`);
    } catch {
      router.push(`/conversation/sess_${Date.now()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-[#6651E8] via-indigo-600 to-purple-700 text-white shadow-xl high-contrast:bg-black high-contrast:border-4 high-contrast:border-yellow-400">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wide uppercase mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-300" />
            <span>Ready for Live Communication</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black high-contrast:text-yellow-400">
            Welcome back, {user?.name || 'Alex'}!
          </h1>
          <p className="mt-2 text-indigo-100 high-contrast:text-white max-w-xl text-base sm:text-lg">
            Tap below to begin a live multimodal conversation with partner speech transcription and AI assistance.
          </p>
        </div>

        <div>
          <Button
            size="touch"
            variant="outline"
            onClick={handleStartSession}
            className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#6651E8] border-none shadow-lg gap-3"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Start Live Session</span>
          </Button>
        </div>
      </div>

      {/* Hardware Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">TTS Engine</div>
            <div className="text-sm font-bold text-[#172554] dark:text-white">Active &amp; Ready</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Microphone STT</div>
            <div className="text-sm font-bold text-[#172554] dark:text-white">Standby</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Vision Landmarks</div>
            <div className="text-sm font-bold text-[#172554] dark:text-white">Consent Ready</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Multimodal AI</div>
            <div className="text-sm font-bold text-[#172554] dark:text-white">Enabled</div>
          </div>
        </div>
      </div>

      {/* Quick Phrases Grid */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
              <Volume2 className="w-6 h-6 text-[#6651E8]" />
              <span>Quick Communication Phrases</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tap any phrase to speak it aloud immediately.
            </p>
          </div>
          {lastSpoken && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Spoke: "{lastSpoken}"</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_QUICK_PHRASES.map((phrase, idx) => (
            <button
              key={phrase.id}
              onClick={() => handleSpeakPhrase(phrase.text)}
              className={`p-5 rounded-2xl border-2 text-left flex items-center justify-between group transition-all hover:scale-[1.02] shadow-sm min-h-[56px] ${phrase.color}`}
              aria-label={`Speak: ${phrase.text}`}
            >
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  [{idx + 1}] {phrase.category}
                </span>
                <span className="text-base sm:text-lg font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
                  {phrase.text}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-700/80 group-hover:bg-[#6651E8] group-hover:text-white transition flex items-center justify-center flex-shrink-0 text-slate-600 dark:text-slate-300 shadow-sm">
                <Volume2 className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#6651E8]" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#172554] dark:text-white">
              Recent Conversations
            </h2>
          </div>
          <Link href="/history" className="text-xs sm:text-sm font-bold text-[#6651E8] hover:underline">
            View All History &rarr;
          </Link>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 flex items-center justify-between gap-4 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#172554] dark:text-white text-sm sm:text-base">
                    {sess.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sess.updated_at}
                    </span>
                    <span>&bull;</span>
                    <span>{sess.messages_count} messages</span>
                  </div>
                </div>
              </div>

              <Link href={`/conversation/${sess.id}`}>
                <Button variant="outline" size="sm">
                  Resume
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

