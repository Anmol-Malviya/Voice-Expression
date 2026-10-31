'use client';

import React, { useRef, useEffect } from 'react';
import { Video, VideoOff, Camera, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface CameraPreviewProps {
  isActive: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCaptureFrame: (videoEl: HTMLVideoElement) => void;
  error?: string | null;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  isActive,
  onStartCamera,
  onStopCamera,
  onCaptureFrame,
  error,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isActive) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Camera access denied:', err);
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

  const handleCapture = () => {
    if (videoRef.current) {
      onCaptureFrame(videoRef.current);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 high-contrast:bg-black rounded-3xl border-2 border-slate-200 dark:border-slate-800 high-contrast:border-yellow-400 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-lg text-[#172554] dark:text-white high-contrast:text-yellow-400 flex items-center gap-2">
          <Video className="w-5 h-5 text-[#6651E8]" />
          <span>Camera & Gesture Cues</span>
        </h3>
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
          {isActive ? 'Live Stream' : 'Camera Off'}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Video Viewport */}
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

        {!isActive && (
          <div className="text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <VideoOff className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-300">
              Camera is currently inactive
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Start the camera to detect hand gestures, head nods, and non-verbal cues.
            </p>
          </div>
        )}
      </div>

      {/* Privacy Guarantee Notice */}
      <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
        <ShieldCheck className="w-4 h-4 text-[#6651E8] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Zero Raw Media Retention:</span> Camera
          frames are processed strictly in ephemeral memory and discarded immediately.
          No images are stored to disk.
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

        {isActive && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCapture}
            className="gap-2.5 min-h-[52px]"
            title="Capture frame to recognize gesture"
          >
            <Camera className="w-5 h-5 text-[#6651E8]" />
            <span>Capture Frame</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraPreview;

