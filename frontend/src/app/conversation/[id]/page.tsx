'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  HelpCircle,
  Activity,
  ArrowLeft,
  Camera,
  Loader2,
  Bot,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppHeader } from '@/components/AppHeader';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageComposer } from '@/components/MessageComposer';
import { QuickPhrasePanel } from '@/components/QuickPhrasePanel';
import { VoiceControls } from '@/components/VoiceControls';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AccessibilityToolbar } from '@/components/AccessibilityToolbar';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useAppStore } from '@/store/useAppStore';
import messageService from '@/services/message.service';
import speechService from '@/services/speech.service';
import gestureService from '@/services/gesture.service';
import { Message, CandidateReply } from '@/types';

type AudioProcessingState = 'idle' | 'recording' | 'transcribing' | 'synthesizing' | 'speaking' | 'paused';

export default function LiveConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = (params?.id as string) || 'active_session';

  const {
    speechRate,
    setSpeechRate,
    volume,
    setVolume,
    language,
    setLanguage,
    selectedVoice,
    setSelectedVoice,
  } = useAppStore();

  // Messages State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio State Machine
  const [audioState, setAudioState] = useState<AudioProcessingState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // STT Microphone State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Camera & Gesture Preview
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState('none');
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI Conversational Intelligence State
  const [isInferring, setIsInferring] = useState(false);
  const [detectedIntent, setDetectedIntent] = useState<string>('greeting');
  const [aiExplanation, setAiExplanation] = useState<string>(
    'Proposals generated to match conversation flow. User confirmation strictly required.'
  );
  const [candidates, setCandidates] = useState<CandidateReply[]>([
    {
      candidate_id: 'cand_1',
      text: 'I am doing okay, thank you.',
      reason: 'Polite response to partner greeting',
      confidence: 0.92,
    },
    {
      candidate_id: 'cand_2',
      text: 'Yes, please get me some water.',
      reason: 'Direct hydration request',
      confidence: 0.86,
    },
    {
      candidate_id: 'cand_3',
      text: 'Please give me a moment to respond.',
      reason: 'Assistive clarification buffer',
      confidence: 0.81,
    },
  ]);

  // Load Initial Messages
  useEffect(() => {
    messageService.getMessages(conversationId).then(setMessages);
  }, [conversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Real Speech Recognition (STT) Setup
  const handleToggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      setAudioState('idle');
      setInterimTranscript('');
      toast.info('Partner microphone paused.');
      return;
    }

    setSttError(null);
    setAudioState('recording');

    const recognition = speechService.createSpeechRecognition({
      language: language === 'hi' ? 'hi-IN' : 'en-US',
      continuous: true,
      interimResults: true,
      onResult: (finalText, interimText) => {
        setInterimTranscript(interimText);
        if (finalText.trim()) {
          setAudioState('transcribing');
          const partnerMsg: Message = {
            id: 'ptn_' + Date.now(),
            conversation_id: conversationId,
            sender: 'partner',
            content: finalText.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: 'speech_transcription',
          };
          setMessages((prev) => [...prev, partnerMsg]);
          setInterimTranscript('');

          // Trigger contextually ranked AI candidates via OpenAI/Assistive engine
          triggerCandidateInference(finalText.trim(), detectedGesture);
          setAudioState('recording');
        }
      },
      onError: (err) => {
        setSttError(err);
        setIsListening(false);
        setAudioState('idle');
        toast.error(err);
      },
      onEnd: () => {
        setIsListening(false);
        setAudioState('idle');
      },
    });

    if (recognition) {
      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
        toast.success('Listening to conversation partner (STT active)...');
      } catch (e) {
        setSttError('Could not start speech recognition.');
        setIsListening(false);
        setAudioState('idle');
      }
    }
  };

  // Trigger Real AI Candidate Inference (OpenAI / Assistive API)
  const triggerCandidateInference = async (partnerText: string, gesture: string) => {
    setIsInferring(true);
    try {
      const resp = await messageService.getAIResponse({
        conversationId,
        userMessage: partnerText,
        gesture,
        language,
      });

      if (resp && resp.candidates && resp.candidates.length > 0) {
        setCandidates(resp.candidates);
        setAiExplanation(resp.explanation || resp.rationale || 'Context-aware suggestions proposed.');
        setDetectedIntent(resp.intent_classification || 'general_statement');
      } else {
        const results = await messageService.generateCandidates({
          conversationId,
          lastPartnerSpeech: partnerText,
          detectedGesture: gesture,
          language,
        });
        setCandidates(results);
      }
    } catch {
      const results = await messageService.generateCandidates({
        conversationId,
        lastPartnerSpeech: partnerText,
        detectedGesture: gesture,
        language,
      });
      setCandidates(results);
    } finally {
      setIsInferring(false);
    }
  };

  // Clarify typed shorthand in composer (e.g. 'I water' -> alternative proposals)
  const handleClarifyDraft = async () => {
    if (!inputText.trim()) return;
    setIsInferring(true);
    try {
      const res = await messageService.getAISuggestions({
        text: inputText.trim(),
        conversationId,
        language,
      });
      if (res && res.candidates && res.candidates.length > 0) {
        setCandidates(res.candidates);
        setAiExplanation(res.explanation || 'Clarified shorthand into complete polite sentences.');
        setDetectedIntent(res.intent || 'request_need');
        toast.success('Generated AI alternative message suggestions!');
      }
    } catch (e) {
      toast.error('Could not generate AI suggestions.');
    } finally {
      setIsInferring(false);
    }
  };

  // STRICT CONFIRMATION GATE: Confirm only (no speech, visual confirmation)
  const handleConfirmCandidate = async (candidate: CandidateReply) => {
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      content: candidate.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'ai_suggestion',
      fusedSignals: detectedGesture !== 'none' ? [`Gesture: ${detectedGesture}`] : undefined,
      isSpoken: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    messageService.sendMessage(conversationId, candidate.text, 'ai_suggestion');
    messageService.confirmProposal(conversationId, 'confirm', candidate.text);
    toast.success('Confirmed and added to conversation.');
  };

  // STRICT CONFIRMATION GATE: Confirm AND Speak aloud via ElevenLabs TTS
  const handleConfirmAndSpeakCandidate = async (candidate: CandidateReply) => {
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      content: candidate.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'ai_suggestion',
      fusedSignals: detectedGesture !== 'none' ? [`Gesture: ${detectedGesture}`] : undefined,
      isSpoken: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    messageService.sendMessage(conversationId, candidate.text, 'ai_suggestion');
    messageService.confirmProposal(conversationId, 'confirm', candidate.text);

    toast.success('Confirmed reply! Synthesizing natural voice...');
    await handleSpeakAloud(candidate.text);
  };

  // Load candidate into composer for user modification
  const handleEditCandidate = (candidate: CandidateReply) => {
    setInputText(candidate.text);
    messageService.confirmProposal(conversationId, 'edit', candidate.text);
    toast.info('Candidate reply loaded into composer. Edit then tap Send or Speak.');
  };

  // Send message from Composer
  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'text',
      fusedSignals: detectedGesture !== 'none' ? [`Gesture: ${detectedGesture}`] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    messageService.sendMessage(conversationId, text, 'text');
    setInputText('');
  };

  // Real TTS Playback (ElevenLabs with browser-native fallback)
  const handleSpeakAloud = async (text: string) => {
    if (!text.trim()) return;

    setAudioState('synthesizing');
    setIsSpeaking(true);
    setIsPaused(false);

    try {
      await speechService.speakAloud(text, {
        rate: speechRate,
        volume,
        voiceId: selectedVoice,
        language,
        onStart: () => {
          setAudioState('speaking');
          setIsSpeaking(true);
        },
        onEnd: () => {
          setAudioState('idle');
          setIsSpeaking(false);
          setIsPaused(false);
        },
        onError: (err) => {
          setAudioState('idle');
          setIsSpeaking(false);
          setIsPaused(false);
          toast.error('Voice synthesis error: using browser speech synthesis fallback.');
        },
      });
    } catch {
      setAudioState('idle');
      setIsSpeaking(false);
    }
  };

  const handlePauseSpeaking = () => {
    speechService.pause();
    setIsPaused(true);
    setAudioState('paused');
  };

  const handleResumeSpeaking = () => {
    speechService.resume();
    setIsPaused(false);
    setAudioState('speaking');
  };

  const handleStopSpeaking = () => {
    speechService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setAudioState('idle');
  };

  // Camera Management
  const handleToggleCamera = async () => {
    if (cameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setShowCamera(false);
      setDetectedGesture('none');
      return;
    }

    try {
      setShowCamera(true);
      const stream = await gestureService.startCamera();
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      toast.success('Camera preview started. Ephemeral privacy active.');
    } catch {
      toast.error('Unable to access camera.');
      setShowCamera(false);
      setCameraActive(false);
    }
  };

  const handleSimulateGesture = (gestureKey: string, gestureLabel: string) => {
    setDetectedGesture(gestureKey);
    toast.info(`Detected cue: ${gestureLabel}`);
    triggerCandidateInference(
      messages[messages.length - 1]?.content || '',
      gestureKey
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 md:pb-8">
      {/* Workspace Header */}
      <AppHeader
        title="Live Assistive Conversation"
        subtitle={`Session ID: ${conversationId} • Mode: Multimodal Fusion`}
        backHref="/dashboard"
        statusBadge={
          audioState === 'speaking'
            ? 'Speaking Aloud'
            : audioState === 'synthesizing'
            ? 'Synthesizing Voice...'
            : isListening
            ? 'Partner Mic Active'
            : 'Ready'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={cameraActive ? 'danger' : 'outline'}
              size="md"
              onClick={handleToggleCamera}
              className="gap-2"
              title="Toggle gesture camera"
            >
              {cameraActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-[#6651E8]" />}
              <span className="hidden sm:inline">{cameraActive ? 'Stop Camera' : 'Gesture Camera'}</span>
            </Button>
          </div>
        }
      />

      {/* Main Split Layout: Left (Dialogue & Composer) / Right (AI Proposals, Phrases, Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Message History & Composer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Messages Container */}
          <div
            className="w-full bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 p-6 min-h-[460px] max-h-[560px] overflow-y-auto shadow-sm flex flex-col justify-between"
            role="log"
            aria-label="Conversation message history"
          >
            <div className="space-y-1">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSpeak={handleSpeakAloud}
                />
              ))}

              {/* Interim Live Transcript Indicator */}
              {interimTranscript && (
                <div className="p-3 my-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-sm font-semibold flex items-center gap-2 animate-pulse">
                  <Mic className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Transcribing partner speech: "{interimTranscript}"</span>
                </div>
              )}

              {/* Audio Synthesizing Indicator */}
              {audioState === 'synthesizing' && (
                <div className="p-3 my-2 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[#6651E8] dark:text-purple-300 text-sm font-semibold flex items-center gap-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6651E8]" />
                  <span>ElevenLabs TTS is synthesizing natural speech...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Conversation status banner at bottom */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero raw media saved • Ephemeral memory</span>
              </span>
              <span>{messages.length} messages in dialogue</span>
            </div>
          </div>

          {/* Message Composer with AI Clarify Button */}
          <MessageComposer
            value={inputText}
            onChange={setInputText}
            onSend={handleSendMessage}
            onSpeak={handleSpeakAloud}
            onClarify={handleClarifyDraft}
            isClarifying={isInferring}
          />
        </div>

        {/* Right Column: AI Suggestions, Quick Phrases, Voice Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. STRICT CONFIRMATION GATE: AI Suggestion Candidates */}
          <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-purple-200 dark:border-purple-900 high-contrast:border-yellow-400 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 leading-tight">
                    AI Suggested Proposals
                  </h3>
                  <span className="text-[11px] text-purple-600 dark:text-purple-300 font-bold uppercase tracking-wider">
                    Intent: {detectedIntent.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Agency Guard
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-100 dark:border-purple-900/40">
              {aiExplanation}
            </p>

            <div className="space-y-3">
              {candidates.map((cand, idx) => (
                <div
                  key={cand.candidate_id}
                  className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 hover:border-[#6651E8] bg-slate-50/70 dark:bg-slate-800/40 transition space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-sm sm:text-base text-[#172554] dark:text-white high-contrast:text-yellow-400">
                      "{cand.text}"
                    </p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                      {Math.round(cand.confidence * 100)}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    Reason: {cand.reason}
                  </p>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex-wrap">
                    <button
                      onClick={() => handleEditCandidate(cand)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 min-h-[36px]"
                      title="Load candidate reply into composer to edit before speaking"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleConfirmCandidate(cand)}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 min-h-[36px]"
                      title="Confirm without speaking aloud"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>

                    <button
                      onClick={() => handleConfirmAndSpeakCandidate(cand)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#6651E8] hover:bg-[#533ed4] text-white text-xs font-black flex items-center gap-1.5 min-h-[36px] shadow-sm"
                      title="Confirm proposal and speak immediately via natural TTS"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Speak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Optional Camera Live Stream Drawer */}
          {showCamera && (
            <div className="p-4 rounded-3xl bg-slate-900 border-2 border-purple-500 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>On-Device Gesture Cue</span>
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Detected: {detectedGesture}
                </span>
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 self-center">Test Cues:</span>
                <button
                  onClick={() => handleSimulateGesture('thumbs_up', 'Thumbs Up (Agree)')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700"
                >
                  👍 Agree
                </button>
                <button
                  onClick={() => handleSimulateGesture('open_palm', 'Open Palm (Wait)')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700"
                >
                  ✋ Wait
                </button>
                <button
                  onClick={() => handleSimulateGesture('wave', 'Wave (Hello)')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700"
                >
                  👋 Wave
                </button>
              </div>
            </div>
          )}

          {/* 3. Voice Controls */}
          <VoiceControls
            isListening={isListening}
            onToggleListening={handleToggleListening}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            onPauseSpeaking={handlePauseSpeaking}
            onResumeSpeaking={handleResumeSpeaking}
            onStopSpeaking={handleStopSpeaking}
            speechRate={speechRate}
            onRateChange={setSpeechRate}
            volume={volume}
            onVolumeChange={setVolume}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            sttError={sttError}
          />

          {/* 4. Quick Phrases for Workspace */}
          <QuickPhrasePanel
            onSelectPhrase={(p) => setInputText((prev) => (prev ? `${prev} ${p}` : p))}
            onSpeakPhrase={handleSpeakAloud}
          />

          {/* 5. Accessibility Shortcuts */}
          <AccessibilityToolbar />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}
