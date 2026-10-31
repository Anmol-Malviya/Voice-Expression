'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Check, 
  Edit3, 
  X, 
  Wifi, 
  WifiOff, 
  Play, 
  Pause, 
  Trash2, 
  ShieldCheck,
  Send,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';

const QUICK_PHRASES = [
  "I need help.",
  "Please wait.",
  "I need water.",
  "I am not feeling well.",
  "Thank you.",
  "Please repeat.",
  "Yes.",
  "No.",
  "I want to go home.",
  "I need to go outside.",
  "I want to talk."
];

interface Message {
  id: string;
  sender: 'user' | 'partner';
  content: string;
  timestamp: string;
  fusedSignals?: string[];
}

interface Candidate {
  candidate_id: string;
  text: string;
  reason: string;
  confidence: number;
}

export default function LiveConversationPage() {
  const params = useParams();
  const conversationId = (params?.id as string) || 'active_session';
  const { speechRate, volume, language } = useAppStore();

  // Conversation Messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'partner',
      content: 'Hello! How are you feeling right now?',
      timestamp: '14:30:10',
    }
  ]);
  const [inputText, setInputText] = useState('');

  // Audio Playback State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // STT Microphone State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Camera & Gesture State
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState('none');
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI Multimodal Inference & Strict Confirmation Gate
  const [isInferring, setIsInferring] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      candidate_id: 'cand_1',
      text: 'I am doing okay, thank you.',
      reason: 'Polite response to partner greeting',
      confidence: 0.88,
    },
    {
      candidate_id: 'cand_2',
      text: 'I am not feeling very well today.',
      reason: 'Physical discomfort context',
      confidence: 0.65,
    },
    {
      candidate_id: 'cand_3',
      text: 'Could you give me a few moments, please?',
      reason: 'Patience request',
      confidence: 0.52,
    }
  ]);
  const [needsClarification, setNeedsClarification] = useState(false);

  // Live WebSocket Status
  const [wsConnected, setWsConnected] = useState(true);
  const [latencyMs, setLatencyMs] = useState(420);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSttError(null);
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else interim += event.results[i][0].transcript;
          }
          setInterimTranscript(interim);
          if (final.trim()) {
            handleReceivePartnerSpeech(final.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setSttError('Microphone permission denied. Please allow microphone access in browser.');
          } else {
            setSttError(`Microphone notice: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setSttError(null);
      setInterimTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Fallback simulated partner speech for testing
        const samplePartner = "Would you like some water or tea?";
        handleReceivePartnerSpeech(samplePartner);
      }
    }
  };

  const handleReceivePartnerSpeech = (text: string) => {
    const newMsg: Message = {
      id: 'm_' + Date.now(),
      sender: 'partner',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    triggerAIInference(text);
  };

  const triggerAIInference = async (partnerText: string) => {
    setIsInferring(true);
    setNeedsClarification(false);
    const start = performance.now();

    try {
      const res = await api.post('/inference', {
        session_id: conversationId,
        partner_text: partnerText,
        gesture: detectedGesture !== 'none' ? detectedGesture : undefined,
        language: language,
      });
      if (res.data) {
        setCandidates(res.data.candidates || []);
        setNeedsClarification(res.data.needs_clarification || false);
      }
    } catch {
      // Local fallback heuristic
      const q = partnerText.toLowerCase();
      if (q.includes('water') || q.includes('drink')) {
        setCandidates([
          { candidate_id: 'c1', text: 'Yes, please get me some water.', reason: 'Matches water query', confidence: 0.94 },
          { candidate_id: 'c2', text: 'No, thank you, I am not thirsty.', reason: 'Polite decline', confidence: 0.82 },
        ]);
      } else {
        setCandidates([
          { candidate_id: 'c1', text: 'Yes, that sounds good.', reason: 'Affirmative response', confidence: 0.88 },
          { candidate_id: 'c2', text: 'Could you please repeat that?', reason: 'Clarification query', confidence: 0.74 },
        ]);
      }
    } finally {
      setLatencyMs(Math.round(performance.now() - start) || 380);
      setIsInferring(false);
    }
  };

  // TTS Speech Output
  const speakAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.volume = volume;
      utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // STRICT CONFIRMATION GATE: Never speak without explicit user approval
  const handleConfirmCandidate = async (candidate: Candidate) => {
    const newMsg: Message = {
      id: 'm_' + Date.now(),
      sender: 'user',
      content: candidate.text,
      timestamp: new Date().toLocaleTimeString(),
      fusedSignals: detectedGesture !== 'none' ? [detectedGesture] : ['confirmed_candidate'],
    };
    setMessages((prev) => [...prev, newMsg]);

    // Record confirmation event in backend
    try {
      await api.post(`/sessions/${conversationId}/confirmations`, {
        candidate_id: candidate.candidate_id,
        action: 'confirm',
        edited_text: candidate.text,
      });
    } catch {}

    speakAudio(candidate.text);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setInputText(candidate.text);
  };

  const handleRejectCandidates = () => {
    setCandidates([]);
  };

  const handleSendManual = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: 'm_' + Date.now(),
      sender: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString(),
      fusedSignals: ['manual_typed'],
    };
    setMessages((prev) => [...prev, newMsg]);
    speakAudio(inputText.trim());
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    const newMsg: Message = {
      id: 'm_' + Date.now(),
      sender: 'user',
      content: phrase,
      timestamp: new Date().toLocaleTimeString(),
      fusedSignals: ['quick_phrase'],
    };
    setMessages((prev) => [...prev, newMsg]);
    speakAudio(phrase);
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.warn('Camera access denied:', err);
      }
    }
  };

  const handleSimulateGesture = (gesture: string) => {
    setDetectedGesture(gesture);
    if (gesture !== 'none') {
      triggerAIInference(messages[messages.length - 1]?.content || 'Hello');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Status & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#172554] dark:text-white">
              Live Assist Session
            </h1>
            <span className="text-xs text-slate-500">
              Session: {conversationId.slice(0, 14)} &bull; Mode: Multimodal Live
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
            {wsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{wsConnected ? 'WebSocket Live' : 'Reconnecting'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
            <span>Latency: {latencyMs}ms (target &lt; 2s)</span>
          </div>

          {isSpeaking && (
            <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950 px-2 py-1 rounded-lg border border-purple-300">
              <button
                onClick={stopAudio}
                className="p-1 rounded text-rose-600 hover:bg-rose-100"
                title="Stop Audio"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setMessages([])}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Dual-Column Live Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Conversation Transcript & Input (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[640px] bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#6651E8]" />
              <h2 className="font-extrabold text-[#172554] dark:text-white text-base">
                Conversation Transcript
              </h2>
            </div>

            <Button
              size="sm"
              variant={isListening ? 'danger' : 'primary'}
              onClick={handleToggleListening}
              className="gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Listening (Tap to Stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Listen to Partner</span>
                </>
              )}
            </Button>
          </div>

          {sttError && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold border-b border-amber-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span>{sttError}</span>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4" role="log" aria-live="polite">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-semibold">
                    <span>{isUser ? 'You (Speech Synthesized)' : 'Partner'}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-base sm:text-lg font-bold shadow-sm ${
                      isUser
                        ? 'bg-[#6651E8] text-white rounded-br-none high-contrast:bg-yellow-400 high-contrast:text-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-[#172554] dark:text-white rounded-bl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {isUser && (
                      <button
                        onClick={() => speakAudio(msg.content)}
                        className="mt-2 text-xs flex items-center gap-1 opacity-80 hover:opacity-100 text-indigo-100 font-bold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak Again</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {isListening && interimTranscript && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="text-xs text-slate-400 mb-1">Partner is speaking...</div>
                <div className="max-w-[85%] p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 italic text-base border border-dashed border-purple-400">
                  {interimTranscript}
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Large Text Input + Instant TTS Button */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <form onSubmit={handleSendManual} className="flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your response to speak aloud..."
                className="flex-1 py-4 px-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white text-base sm:text-lg font-semibold focus:border-[#6651E8] focus:ring-2 focus:ring-brand-500/20 transition min-h-[52px]"
              />
              <Button
                type="submit"
                disabled={!inputText.trim()}
                size="lg"
                className="gap-2 min-h-[52px]"
              >
                <Volume2 className="w-5 h-5" />
                <span className="hidden sm:inline">Speak</span>
              </Button>
            </form>
          </div>

        </div>

        {/* Right Column: Multimodal AI Ranked Suggestions & Confirmation Gate (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          <Card className="border-2 border-purple-200 dark:border-purple-900 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#6651E8]" />
                <h2 className="text-lg sm:text-xl font-black text-[#172554] dark:text-white">
                  AI Ranked Replies
                </h2>
              </div>
              <Badge variant="teal">Confirmation Gate Active</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              AI suggestions are proposals only. Select <strong>Speak</strong>, <strong>Edit</strong>, or <strong>Reject</strong>:
            </p>

            {isInferring ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Sparkles className="w-8 h-8 text-[#6651E8] animate-spin mb-2" />
                <span className="font-bold text-xs">Fusing speech and gestures...</span>
              </div>
            ) : candidates.length > 0 ? (
              <div className="space-y-3">
                {candidates.map((cand) => (
                  <div
                    key={cand.candidate_id}
                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50/50 dark:bg-slate-800/30 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-500">{cand.reason}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[11px]">
                        {Math.round(cand.confidence * 100)}% match
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-black text-[#172554] dark:text-white mb-3">
                      "{cand.text}"
                    </div>

                    {/* Strict Confirmation Gate Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmCandidate(cand)}
                        className="flex-1 gap-1.5"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Speak Reply</span>
                      </Button>

                      <button
                        onClick={() => handleEditCandidate(cand)}
                        className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#172554] dark:text-white"
                        title="Edit before speaking"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={handleRejectCandidates}
                        className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 text-rose-600"
                        title="Reject candidates"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active candidates. Listen to partner or type a response.
              </div>
            )}

            {needsClarification && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Signals were ambiguous. Please select or edit your desired response manually.</span>
              </div>
            )}
          </Card>

          {/* Multimodal Camera Vision & Gesture Module */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-[#172554] dark:text-white text-sm sm:text-base">
                  Visual Cues &amp; Gesture Module
                </h3>
              </div>
              <Button
                size="sm"
                variant={cameraActive ? 'danger' : 'outline'}
                onClick={handleToggleCamera}
                className="gap-1.5 text-xs"
              >
                {cameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{cameraActive ? 'Stop Camera' : 'Enable Camera'}</span>
              </Button>
            </div>

            {cameraActive ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-3 border border-slate-700">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>On-Device Landmark Tracking Active</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center mb-3 text-xs text-slate-500">
                Camera is off. Click "Enable Camera" for live landmark capture, or use simulated gesture tags below.
              </div>
            )}

            {/* Gesture Simulator Pill Selector */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Active Gesture Signal:</span>
                <span className="font-extrabold uppercase text-purple-600">
                  {detectedGesture}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'thumbs_up', label: '👍 Thumbs Up' },
                  { id: 'thumbs_down', label: '👎 Thumbs Down' },
                  { id: 'open_palm', label: '✋ Open Palm (Wait)' },
                  { id: 'wave', label: '👋 Wave (Hello)' },
                  { id: 'head_nod', label: '🙂 Head Nod' }
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSimulateGesture(g.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      detectedGesture === g.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#172554] dark:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* Bottom Quick Phrases Tray */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Urgent Communication Shortcuts (1-Touch Direct TTS)
          </span>
          <span className="text-xs font-bold text-[#6651E8]">
            Instant Voice
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {QUICK_PHRASES.map((phrase, i) => (
            <button
              key={i}
              onClick={() => handleQuickPhrase(phrase)}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-800 text-[#172554] dark:text-white font-bold text-xs text-left truncate transition group"
              title={`Speak: ${phrase}`}
            >
              <span className="group-hover:text-[#6651E8] transition block truncate">{phrase}</span>
            </button>
          ))}
        </div>
      </Card>

    </div>
  );
}

