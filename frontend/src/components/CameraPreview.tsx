'use client';

import React, { useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Camera,
  ShieldCheck,
  AlertCircle,
  Activity,
  Radio,
  Layers,
} from 'lucide-react';
import { Button } from './ui/Button';
import { LandmarkPoint } from '@/types';

// MediaPipe 21 hand connection pairs
const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                               // Palm base
];

interface CameraPreviewProps {
  isActive: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureFrame: (videoEl: HTMLVideoElement) => void;
  landmarks?: LandmarkPoint[] | null;
  isContinuousTracking?: boolean;
  onToggleContinuousTracking?: () => void;
  isRecognizing?: boolean;
  error?: string | null;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  isActive,
  onStartCamera,
  onStopCamera,
  onCaptureFrame,
  landmarks,
  isContinuousTracking = false,
  onToggleContinuousTracking,
  isRecognizing = false,
  error,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Manage WebCam MediaStream
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isActive) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied or failed:', err);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isActive]);

  // Draw 21 MediaPipe skeletal hand landmarks onto canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive || !landmarks || landmarks.length < 21) {
      return;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Draw skeletal lines
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#10B981'; // Vibrant emerald green
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2) {
        // Mirrored coordinate match
        const x1 = (1.0 - p1.x) * w;
        const y1 = p1.y * h;
        const x2 = (1.0 - p2.x) * w;
        const y2 = p2.y * h;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p) continue;

      const x = (1.0 - p.x) * w;
      const y = p.y * h;

      ctx.beginPath();
      ctx.arc(x, y, i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = i === 4 || i === 8 ? '#6651E8' : '#34D399'; // Purple for tips, emerald for joints
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    }
  }, [landmarks, isActive]);

  const handleCapture = () => {
    if (videoRef.current) {
      onCaptureFrame(videoRef.current);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 p-5 shadow-sm space-y-4">
      {/* Header and Live Status */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
          <Video className="w-5 h-5 text-[#6651E8]" />
          <span>Multimodal Camera Input</span>
        </h3>
        
        <div className="flex items-center gap-2">
          {isContinuousTracking && isActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-[#6651E8] dark:bg-purple-950/80 dark:text-purple-300 animate-pulse">
              <Radio className="w-3 h-3" />
              <span>Tracking Live</span>
            </span>
          )}
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isActive
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isActive ? 'Camera Online' : 'Camera Off'}
          </span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Video & Skeletal Landmark Viewport */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${
            !isActive ? 'hidden' : 'block'
          }`}
        />

        {/* Canvas for MediaPipe 21 Hand Landmarks */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            !isActive ? 'hidden' : 'block'
          }`}
        />

        {/* Scanning Indicator Bar */}
        {isActive && isRecognizing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#6651E8] to-transparent animate-pulse" />
        )}

        {!isActive && (
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <VideoOff className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-300">
              Camera is currently inactive
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Start the camera to detect hand gestures, head movements, and non-verbal communication shortcuts.
            </p>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Notice */}
      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-4 h-4 text-[#6651E8] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Ephemeral Memory Processing:</span> MediaPipe
          landmarks are computed entirely in volatile memory. No raw video or audio recordings are stored to disk.
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <Button
          type="button"
          variant={isActive ? 'danger' : 'primary'}
          size="lg"
          onClick={isActive ? onStopCamera : onStartCamera}
          className="flex-1 gap-2.5 min-h-[52px]"
          aria-label={isActive ? 'Stop Camera' : 'Start Camera'}
        >
          {isActive ? (
            <>
              <VideoOff className="w-5 h-5" />
              <span>Stop Camera</span>
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              <span>Start Camera Preview</span>
            </>
          )}
        </Button>

        {isActive && onToggleContinuousTracking && (
          <Button
            type="button"
            variant={isContinuousTracking ? 'secondary' : 'outline'}
            size="lg"
            onClick={onToggleContinuousTracking}
            className="gap-2 min-h-[52px]"
            title="Toggle live continuous gesture tracking"
            aria-pressed={isContinuousTracking}
          >
            <Activity className="w-5 h-5 text-[#6651E8]" />
            <span>{isContinuousTracking ? 'Live Tracking: ON' : 'Live Tracking: OFF'}</span>
          </Button>
        )}

        {isActive && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCapture}
            disabled={isRecognizing}
            className="gap-2.5 min-h-[52px]"
            title="Capture current video frame for gesture recognition"
            aria-label="Capture Frame"
          >
            <Camera className="w-5 h-5 text-[#6651E8]" />
            <span>{isRecognizing ? 'Analyzing...' : 'Capture Frame'}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraPreview;
