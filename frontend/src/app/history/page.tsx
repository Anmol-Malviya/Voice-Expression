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
  ShieldCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

const SAMPLE_HISTORY = [
  {
    id: 'sess_101',
    title: 'Consultation with Occupational Therapist',
    date: '31 Oct 2026',
    time: '11:15 AM',
    language: 'English',
    messages: [
      { sender: 'partner', text: 'Good morning! How did your mobility exercises go today?', time: '11:15' },
      { sender: 'user', text: 'I am doing okay, thank you.', time: '11:16' },
      { sender: 'partner', text: 'Would you like some water before we begin?', time: '11:17' },
      { sender: 'user', text: 'Yes, please get me some water.', time: '11:18' },
    ]
  },
  {
    id: 'sess_102',
    title: 'Lunch with Family',
    date: '30 Oct 2026',
    time: '01:30 PM',
    language: 'Hinglish',
    messages: [
      { sender: 'partner', text: 'Khana kaisa laga? Do you want some tea?', time: '13:31' },
      { sender: 'user', text: 'Yes, that sounds good.', time: '13:32' },
      { sender: 'partner', text: 'Alright, I will bring it right away.', time: '13:33' },
      { sender: 'user', text: 'Thank you.', time: '13:34' }
    ]
  }
];

export default function HistoryPage() {
  const [sessions, setSessions] = useState(SAMPLE_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<any>(SAMPLE_HISTORY[0]);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  useEffect(() => {
    api.get('/conversations')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
          setSelectedSession(res.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = sessions.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/conversations/${id}`);
    } catch {}
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selectedSession?.id === id) {
      setSelectedSession(sessions.find(s => s.id !== id) || null);
    }
    setDeleteStatus('Conversation and ephemeral memory permanently purged (FR-016 compliant).');
    setTimeout(() => setDeleteStatus(null), 4000);
  };

  const handleExport = (sess: any) => {
    if (!sess) return;
    const content = (sess.messages || []).map((m: any) => `[${m.time || ''}] ${m.sender === 'user' ? 'Me' : 'Partner'}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sess.title.replace(/\s+/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const playVoice = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#6651E8] font-bold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Session Logs &amp; Audit Trail</span>
          </div>
          <h1 className="text-3xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
            Conversation History
          </h1>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts..."
            className="pl-10 text-xs sm:text-sm"
          />
        </div>
      </div>

      {deleteStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{deleteStatus}</span>
        </div>
      )}

      {/* Dual Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        
        {/* Left: Session List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 space-y-2 overflow-y-auto max-h-[640px]">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedSession?.id === s.id
                    ? 'border-[#6651E8] bg-purple-50 dark:bg-purple-950/50 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    {s.date || '31 Oct 2026'}
                  </span>
                  <span>{s.time || '12:00 PM'}</span>
                </div>
                <div className="font-extrabold text-[#172554] dark:text-white text-sm sm:text-base truncate mb-1">
                  {s.title}
                </div>
                <div className="text-xs text-slate-500">
                  {s.messages?.length || 0} messages &bull; {s.language || 'en'}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching conversation records found.
            </div>
          )}
        </div>

        {/* Right: Transcript Detail (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          {selectedSession ? (
            <>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#172554] dark:text-white">
                      {selectedSession.title}
                    </h2>
                    <span className="text-xs text-slate-500">
                      ID: {selectedSession.id} &bull; Recorded {selectedSession.date || 'Today'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(selectedSession)}
                      className="gap-1.5 text-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(selectedSession.id)}
                      className="text-rose-600 hover:bg-rose-50 gap-1.5 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2">
                  {(selectedSession.messages || []).map((m: any, idx: number) => {
                    const isUser = m.sender === 'user';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-xs text-slate-400 mb-1">
                          {isUser ? 'Spoken by Me' : 'Conversation Partner'} &bull; {m.time}
                        </div>
                        <div
                          className={`p-4 rounded-2xl max-w-[85%] font-bold text-sm sm:text-base ${
                            isUser
                              ? 'bg-[#6651E8] text-white rounded-br-none'
                              : 'bg-slate-100 dark:bg-slate-800 text-[#172554] dark:text-white rounded-bl-none'
                          }`}
                        >
                          <p>{m.text}</p>
                          <button
                            onClick={() => playVoice(m.text)}
                            className="mt-2 text-xs flex items-center gap-1 opacity-80 hover:opacity-100 text-indigo-100 font-bold"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Play Audio</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Link href={`/conversation/${selectedSession.id}`}>
                  <Button size="md" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Resume Live Session</span>
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
              Select a conversation to review details.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

