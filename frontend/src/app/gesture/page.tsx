'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  VideoOff,
  Volume2,
  Check,
  Edit3,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Camera,
  RotateCcw,
  Sliders,
  History,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { CameraPreview } from '@/components/CameraPreview';
import { GestureResultCard } from '@/components/GestureResultCard';
import { GestureMappingsModal } from '@/components/GestureMappingsModal';
import { useAppStore } from '@/store/useAppStore';
import gestureService from '@/services/gesture.service';
import speechService from '@/services/speech.service';
import { GESTURE_DICTIONARY } from '@/lib/constants';
import {
  GestureRecognitionResult,
  GestureHistoryItem,
  GestureDefinition,
  LandmarkPoint,
} from '@/types';

export default function GesturePage() {
  const router = useRouter();
  const { speechRate, volume } = useAppStore();

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isContinuousTracking, setIsContinuousTracking] = useState(false);
  const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Recognition & Landmarks State
  const [isServiceConnected, setIsServiceConnected] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<GestureRecognitionResult | null>({
    gesture_id: 'open_palm',
    label: 'Open Palm',
    confidence: 0.91,
    suggested_sentence: 'Hello',
    ai_suggestions: [
      'Hello, how are you?',
      'Please wait a moment for me.',
      'Hello, good to see you.',
    ],
    timestamp: new Date().toLocaleTimeString(),
    status: 'recognized',
    is_dynamic: false,
    landmark_count: 21,
    description: 'Open hand with fingers extended forward',
  });

  // History and Vocabulary State
  const [historyItems, setHistoryItems] = useState<GestureHistoryItem[]>([]);
  const [vocabulary, setVocabulary] = useState<GestureDefinition[]>([]);
  const [isMappingsModalOpen, setIsMappingsModalOpen] = useState(false);

  // Load vocabulary & history on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [vocab, hist] = await Promise.all([
        gestureService.getVocabulary(),
        gestureService.getHistory(),
      ]);
      setVocabulary(vocab);
      setHistoryItems(hist);
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  };

  // Manage Continuous Live Tracking Loop
  useEffect(() => {
    if (isContinuousTracking && cameraActive) {
      continuousIntervalRef.current = setInterval(() => {
        const videoEl = document.querySelector('video') as HTMLVideoElement | null;
        if (videoEl && videoEl.readyState >= 2 && !isRecognizing) {
          handleCaptureFrame(videoEl, true);
        }
      }, 700);
    } else {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
    }

    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, [isContinuousTracking, cameraActive, isRecognizing]);

  // Camera Actions
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      setCameraActive(true);
      toast.success('Camera preview started. Ephemeral memory processing active.');
    } catch (err: any) {
      setCameraError('Camera access denied or device not found.');
      setCameraActive(false);
      toast.error('Camera permission required for live gesture tracking.');
    }
  };

  const handleStopCamera = () => {
    setCameraActive(false);
    setIsContinuousTracking(false);
    setCurrentLandmarks(null);
    toast.info('Camera stream stopped.');
  };

  const handleCaptureFrame = async (videoEl: HTMLVideoElement, isSilent = false) => {
    if (!isSilent) setIsRecognizing(true);
    try {
      const base64Frame = gestureService.captureFrameAsBase64(videoEl);
      if (!base64Frame) {
        if (!isSilent) toast.error('Unable to capture video frame.');
        return;
      }

      const result = await gestureService.recognizeGesture({
        imageBase64: base64Frame,
      });

      setRecognitionResult(result);

      if (result.landmarks && result.landmarks.length >= 21) {
        setCurrentLandmarks(result.landmarks);
      }

      // Add to local history list
      if (result.status === 'recognized') {
        const newHistoryItem: GestureHistoryItem = {
          history_id: result.gesture_id,
          gesture_id: result.gesture_id,
          label: result.label,
          confidence: result.confidence,
          suggested_text: result.suggested_sentence,
          status: result.status,
          is_dynamic: result.is_dynamic,
          timestamp: result.timestamp,
        };
        setHistoryItems((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
      }

      if (!isSilent) {
        if (result.status === 'recognized') {
          toast.success(`Recognized: ${result.label} (${Math.round(result.confidence * 100)}%)`);
        } else if (result.status === 'uncertain') {
          toast.warning('Gesture uncertain. Please hold steady and try again.');
        } else {
          toast.info('No hand detected in view.');
        }
      }
    } catch (err) {
      if (!isSilent) {
        toast.error('Gesture recognition service unreachable. Loaded fallback example.');
      }
      setIsServiceConnected(false);
    } finally {
      if (!isSilent) setIsRecognizing(false);
    }
  };

  // Select Manual Test Vocabulary Tile
  const handleSelectTestExample = (gesture: typeof GESTURE_DICTIONARY[0]) => {
    const activeItem = vocabulary.find((v) => v.id === gesture.id);
    const phrase = activeItem ? activeItem.current_phrase : gesture.phrase;

    const result: GestureRecognitionResult = {
      gesture_id: gesture.id,
      label: gesture.label,
      confidence: gesture.confidence,
      suggested_sentence: phrase,
      ai_suggestions: [
        phrase,
        `Please assist with: ${phrase}`,
        `Could you help me with: ${phrase}`,
      ],
      timestamp: new Date().toLocaleTimeString(),
      status: 'recognized',
      is_dynamic: gesture.id === 'wave',
      landmark_count: 21,
      description: gesture.description,
    };

    setRecognitionResult(result);
    toast.info(`Loaded gesture sample: ${gesture.label}`);
  };

  // STRICT CONFIRMATION GATE: Convert Confirmed Sentence to Speech
  const handleConfirmAndSpeak = (sentence: string) => {
    if (!sentence.trim()) return;

    speechService.speak(sentence, {
      rate: speechRate,
      volume,
      onStart: () => toast.success(`Speaking confirmed sentence: "${sentence}"`),
      onError: () => toast.error('Speech synthesis failed.'),
    });
  };

  // Send confirmed sentence to live conversation workspace
  const handleSendToWorkspace = (sentence: string) => {
    if (!sentence.trim()) return;
    toast.success('Confirmed sentence forwarded to conversation workspace.');
    router.push(`/conversation/new?initialText=${encodeURIComponent(sentence)}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      <AppSidebar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title="Multimodal Gesture Recognition"
          subtitle="Vision-guided non-verbal communication fused into natural spoken sentences."
          backHref="/dashboard"
          statusBadge={cameraActive ? (isContinuousTracking ? 'Live Tracking' : 'Camera Live') : 'Standby'}
        />

        {/* Top Warning / Service Status */}
        {!isServiceConnected && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">
                Backend recognition service offline. Local fallback and vocabulary samples are enabled.
              </span>
            </div>
            <button
              onClick={() => {
                setIsServiceConnected(true);
                loadInitialData();
              }}
              className="text-xs font-black underline shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Main Grid: Left Column (Camera) & Right Column (Recognized Card & Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Camera Preview & Instructions (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <CameraPreview
              isActive={cameraActive}
              onStartCamera={handleStartCamera}
              onStopCamera={handleStopCamera}
              onCaptureFrame={(v) => handleCaptureFrame(v, false)}
              landmarks={currentLandmarks}
              isContinuousTracking={isContinuousTracking}
              onToggleContinuousTracking={() => setIsContinuousTracking(!isContinuousTracking)}
              isRecognizing={isRecognizing}
              error={cameraError}
            />

            {/* How Vision Tracking Works Card */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-base text-[#172554] dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#6651E8]" />
                  <span>Configurable Gesture Shortcuts</span>
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMappingsModalOpen(true)}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#6651E8]" />
                  <span>Customize Shortcuts</span>
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Hold your hand steadily in front of the camera or perform a gentle wave. The in-memory MediaPipe detector tracks 21 skeletal joint landmarks without saving video.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>👍</span>
                  <span><strong>Thumbs Up:</strong> Yes</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>👎</span>
                  <span><strong>Thumbs Down:</strong> No</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>✋</span>
                  <span><strong>Open Palm:</strong> Hello</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>✊</span>
                  <span><strong>Closed Fist:</strong> Stop</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>👉</span>
                  <span><strong>Pointing:</strong> I need something</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>✌️</span>
                  <span><strong>Peace Sign:</strong> Thank you</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>🛑</span>
                  <span><strong>Stop Gesture:</strong> Please wait</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
                  <span>👋</span>
                  <span><strong>Wave:</strong> Hello, how are you?</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Recognized Gesture, Vocabulary Tiles & History (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* 1. Recognized Result & Strict Confirmation Gate Card */}
            {recognitionResult ? (
              <GestureResultCard
                result={recognitionResult}
                onConfirmAndSpeak={handleConfirmAndSpeak}
                onSendToWorkspace={handleSendToWorkspace}
                onClear={() => {
                  setRecognitionResult(null);
                  setCurrentLandmarks(null);
                }}
                onRetry={() => {
                  const videoEl = document.querySelector('video') as HTMLVideoElement | null;
                  if (videoEl) handleCaptureFrame(videoEl, false);
                }}
              />
            ) : (
              <Card className="p-8 text-center space-y-3 border-dashed">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-[#6651E8] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">
                  Ready For Gesture Recognition
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start the camera above to track hand gestures, or tap any of the vocabulary tiles below to load a sample.
                </p>
              </Card>
            )}

            {/* 2. Interactive Gesture Vocabulary Tiles (All 8 Core Gestures) */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base text-[#172554] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6651E8]" />
                    <span>8 Core Vocabulary Gestures</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Tap any tile to test its mapped phrase, confidence score, and confirmation gate.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMappingsModalOpen(true)}
                  className="text-xs text-[#6651E8] font-bold"
                >
                  Edit Mappings
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {GESTURE_DICTIONARY.map((g) => {
                  const activeItem = vocabulary.find((v) => v.id === g.id);
                  const displayPhrase = activeItem ? activeItem.current_phrase : g.phrase;

                  return (
                    <button
                      key={g.id}
                      onClick={() => handleSelectTestExample(g)}
                      className="p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-[#6651E8] bg-slate-50/60 dark:bg-slate-800/40 text-left transition flex flex-col justify-between group min-h-[96px] focus:outline-none focus:ring-2 focus:ring-[#6651E8]"
                      aria-label={`Select ${g.label} gesture: "${displayPhrase}"`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-2xl" role="img" aria-label={g.label}>
                          {g.icon}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500">
                          {Math.round(g.confidence * 100)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-[#172554] dark:text-white group-hover:text-[#6651E8] transition block">
                          {g.label}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                          "{displayPhrase}"
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. Ephemeral Recognition History Panel */}
            {historyItems.length > 0 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-[#172554] dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-[#6651E8]" />
                    <span>Recent Recognitions (Ephemeral)</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-semibold">
                    {historyItems.length} logged
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {historyItems.map((item, idx) => (
                    <div
                      key={`${item.history_id}_${idx}`}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#172554] dark:text-white">
                            {item.label}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {Math.round(item.confidence * 100)}%
                          </span>
                          <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 truncate font-semibold">
                          "{item.suggested_text}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleConfirmAndSpeak(item.suggested_text)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300 hover:bg-purple-100 font-bold shrink-0 flex items-center gap-1 transition"
                        title="Speak this confirmed message"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak</span>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </div>
      </main>

      {/* Custom Mappings Modal */}
      <GestureMappingsModal
        isOpen={isMappingsModalOpen}
        onClose={() => setIsMappingsModalOpen(false)}
        onMappingsUpdated={(updated) => {
          setVocabulary(updated);
          toast.success('Vocabulary shortcuts refreshed.');
        }}
      />

      <MobileNavigation />
    </div>
  );
}
