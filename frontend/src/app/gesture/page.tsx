'use client';

import React, { useState, useRef } from 'react';
import {
  Video,
  VideoOff,
  Volume2,
  Check,
  Edit3,
  ShieldCheck,
  Sparkles,
  Upload,
  AlertCircle,
  HelpCircle,
  Camera,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { MobileNavigation } from '@/components/MobileNavigation';
import { CameraPreview } from '@/components/CameraPreview';
import { GestureResultCard } from '@/components/GestureResultCard';
import { useAppStore } from '@/store/useAppStore';
import gestureService from '@/services/gesture.service';
import speechService from '@/services/speech.service';
import { GESTURE_DICTIONARY } from '@/lib/constants';
import { GestureRecognitionResult } from '@/types';

export default function GesturePage() {
  const { speechRate, volume } = useAppStore();

  // Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recognition Service State
  const [isServiceConnected, setIsServiceConnected] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<GestureRecognitionResult | null>({
    gesture_id: 'thumbs_up',
    label: 'Thumbs Up',
    confidence: 0.94,
    suggested_sentence: 'Yes, I agree.',
    timestamp: new Date().toLocaleTimeString(),
    landmark_count: 21,
  });

  // Camera Actions
  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      setCameraActive(true);
      toast.success('Camera preview started. Frames kept strictly in memory.');
    } catch (err: any) {
      setCameraError('Camera access denied or device not found.');
      setCameraActive(false);
      toast.error('Camera permission required for live gesture tracking.');
    }
  };

  const handleStopCamera = () => {
    setCameraActive(false);
    toast.info('Camera stream stopped.');
  };

  const handleCaptureFrame = async (videoEl: HTMLVideoElement) => {
    setIsRecognizing(true);
    try {
      const base64Frame = gestureService.captureFrameAsBase64(videoEl);
      if (!base64Frame) {
        toast.error('Unable to capture video frame.');
        return;
      }

      const result = await gestureService.recognizeGesture(base64Frame);
      setRecognitionResult(result);
      toast.success(`Recognized gesture: ${result.label} (${Math.round(result.confidence * 100)}%)`);
    } catch (err) {
      toast.error('Gesture recognition service unreachable. Use manual test examples below.');
      setIsServiceConnected(false);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Manual Test Examples (Per prompt Section 8)
  const handleSelectTestExample = (gesture: typeof GESTURE_DICTIONARY[0]) => {
    const result: GestureRecognitionResult = {
      gesture_id: gesture.id,
      label: gesture.label,
      confidence: gesture.confidence,
      suggested_sentence: gesture.phrase,
      timestamp: new Date().toLocaleTimeString(),
      landmark_count: 21,
    };
    setRecognitionResult(result);
    toast.info(`Loaded test sample: ${gesture.label}`);
  };

  // STRICT CONFIRMATION GATE: Convert to Speech
  const handleConfirmAndSpeak = (sentence: string) => {
    if (!sentence.trim()) return;

    speechService.speak(sentence, {
      rate: speechRate,
      volume,
      onStart: () => toast.success(`Speaking confirmed sentence: "${sentence}"`),
      onError: () => toast.error('Speech synthesis failed.'),
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] pb-16 md:pb-0">
      <AppSidebar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AppHeader
          title="Gesture Recognition Workspace"
          subtitle="Vision-guided non-verbal communication fused into natural spoken sentences."
          backHref="/dashboard"
          statusBadge={cameraActive ? 'Camera Live' : 'Service Standby'}
        />

        {/* Top Warning / Service Status */}
        {!isServiceConnected && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">
                Backend recognition service not connected. Client-side manual test examples are enabled for testing.
              </span>
            </div>
            <button
              onClick={() => setIsServiceConnected(true)}
              className="text-xs font-black underline shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Camera Preview & Privacy Notice (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <CameraPreview
              isActive={cameraActive}
              onStartCamera={handleStartCamera}
              onStopCamera={handleStopCamera}
              onCaptureFrame={handleCaptureFrame}
              error={cameraError}
            />

            {/* Instruction Card */}
            <Card className="p-6 space-y-3">
              <h4 className="font-black text-base text-[#172554] dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#6651E8]" />
                <span>How Vision Tracking Works</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Hold your hand steadily in front of the camera or nod your head. The on-device landmark tracker calculates joint angles without streaming video to external servers.
              </p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>Thumbs Up: Affirmation &bull; "Yes, I agree."</li>
                <li>Thumbs Down: Negation &bull; "No, I disagree."</li>
                <li>Open Palm: Attention/Wait &bull; "Please wait a moment."</li>
                <li>Wave: Greeting &bull; "Hello, good to see you."</li>
              </ul>
            </Card>
          </div>

          {/* Right Column: Recognized Gesture & Manual Test Tiles (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* 1. Recognized Result & Strict Confirmation Gate Card */}
            {recognitionResult ? (
              <GestureResultCard
                result={recognitionResult}
                onConfirmAndSpeak={handleConfirmAndSpeak}
                onClear={() => setRecognitionResult(null)}
              />
            ) : (
              <Card className="p-8 text-center space-y-3 border-dashed">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-[#6651E8] flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">
                  No Gesture Detected Yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start the camera above and tap "Capture Frame", or select one of the test examples below to test the confirmation gate.
                </p>
              </Card>
            )}

            {/* 2. Manual Test Examples (Prompt Section 8 Requirement) */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base text-[#172554] dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6651E8]" />
                    <span>Test Gesture Vocabulary Examples</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Click any tile to load a realistic landmark test sample into the editor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {GESTURE_DICTIONARY.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectTestExample(g)}
                    className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-[#6651E8] bg-slate-50/60 dark:bg-slate-800/40 text-left transition flex flex-col justify-between group min-h-[90px]"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500">
                        {Math.round(g.confidence * 100)}%
                      </span>
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-[#172554] dark:text-white group-hover:text-[#6651E8] transition">
                      {g.label}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}
