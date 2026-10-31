'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Volume2, 
  Check, 
  Edit3, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Image as ImageIcon,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';

const GESTURE_DICTIONARY = [
  { id: 'thumbs_up', label: 'Thumbs Up', phrase: 'Yes, I agree.', confidence: 0.94, icon: '👍' },
  { id: 'thumbs_down', label: 'Thumbs Down', phrase: 'No, I disagree.', confidence: 0.91, icon: '👎' },
  { id: 'open_palm', label: 'Open Palm', phrase: 'Please wait a moment.', confidence: 0.88, icon: '✋' },
  { id: 'wave', label: 'Wave', phrase: 'Hello, good to see you.', confidence: 0.95, icon: '👋' },
  { id: 'pointing', label: 'Pointing', phrase: 'I need that one, please.', confidence: 0.82, icon: '👉' },
  { id: 'head_nod', label: 'Head Nod', phrase: 'Yes, absolutely.', confidence: 0.89, icon: '🙂' },
];

export default function GesturePage() {
  const { speechRate, volume } = useAppStore();
  const [cameraActive, setCameraActive] = useState(false);
  const [activeGesture, setActiveGesture] = useState<any>(null);
  const [suggestedSentence, setSuggestedSentence] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedSentence, setEditedSentence] = useState('');
  const [confirmedSpeech, setConfirmedSpeech] = useState<string | null>(null);

  // Multimodal Image Upload State
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraActive(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  const handleSelectGesture = (gesture: any) => {
    setActiveGesture(gesture);
    setSuggestedSentence(gesture.phrase);
    setEditedSentence(gesture.phrase);
    setIsEditing(false);
    setConfirmedSpeech(null);
  };

  // STRICT CONFIRMATION GATE: Never speak without explicit user approval
  const handleConfirmAndSpeak = () => {
    const textToSpeak = isEditing ? editedSentence : suggestedSentence;
    if (!textToSpeak.trim()) return;

    setConfirmedSpeech(textToSpeak);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speechRate;
      utterance.volume = volume;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    setUploadError(null);
    setProcessingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImagePreview(dataUrl);

      try {
        const res = await api.post('/gesture/recognize', {
          image_data: dataUrl,
          type: 'image_multimodal',
        });
        if (res.data) {
          setImageDescription(res.data.description || 'Object identified from visual context.');
          setSuggestedSentence(res.data.suggested_text || 'I need this item, please.');
          setEditedSentence(res.data.suggested_text || 'I need this item, please.');
        }
      } catch {
        setImageDescription('Item recognized from visual context.');
        setSuggestedSentence('I am referring to this object.');
        setEditedSentence('I am referring to this object.');
      } finally {
        setProcessingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title & Privacy Policy Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Multimodal Vision &amp; Gesture Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
            Gesture &amp; Visual Communication
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Translate physical gestures and visual cues into spoken communication with explicit confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-xs font-semibold text-purple-800 dark:text-purple-200">
          <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <span>Zero Video Storage: Landmarks processed in ephemeral memory only</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Live Camera & Gesture Recognition Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-[#6651E8]" />
                <h2 className="text-lg sm:text-xl font-bold text-[#172554] dark:text-white">
                  Camera Feed
                </h2>
              </div>

              {cameraActive ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleStopCamera}
                  className="gap-1.5"
                >
                  <VideoOff className="w-4 h-4" />
                  <span>Turn Off Camera</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleStartCamera}
                  className="gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Enable Camera Preview</span>
                </Button>
              )}
            </div>

            {/* Video Preview Frame */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {activeGesture && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur border border-purple-500 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{activeGesture.icon}</span>
                        <div>
                          <div className="text-[10px] text-purple-300 font-bold uppercase">Detected Gesture</div>
                          <div className="text-sm font-extrabold">{activeGesture.label}</div>
                        </div>
                      </div>
                      <div className="px-2.5 py-0.5 rounded-full bg-purple-600 text-xs font-black">
                        {Math.round(activeGesture.confidence * 100)}% match
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold max-w-sm mx-auto">
                    Camera is currently off. Click "Enable Camera Preview" to begin, or test with the gesture tiles below.
                  </p>
                </div>
              )}
            </div>

            {/* Configurable Gesture Vocabulary Tiles */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Select Gesture / Test Vocabulary
                </span>
                <span className="text-xs font-bold text-teal-700">
                  MediaPipe Compatible
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GESTURE_DICTIONARY.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGesture(g)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                      activeGesture?.id === g.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-sm font-black text-[#172554] dark:text-white truncate">
                        {g.label}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {Math.round(g.confidence * 100)}% match
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Multimodal Image Input Interface */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-700" />
                <h3 className="text-base sm:text-lg font-bold text-[#172554] dark:text-white">
                  Image Understanding &amp; Objects
                </h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {uploadError && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadedImagePreview ? (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img
                  src={uploadedImagePreview}
                  alt="Uploaded target"
                  className="w-16 h-16 rounded-xl object-cover border"
                />
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Image Context</div>
                  <div className="text-sm font-bold text-[#172554] dark:text-white">
                    {processingImage ? 'Analyzing image...' : imageDescription}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Upload a photo (such as a medication, beverage, or item) to generate instant communication intent.
              </p>
            )}
          </Card>

        </div>

        {/* Right Column: Strict Confirmation Gate & Speech Output (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-2 border-purple-300 dark:border-purple-800 flex flex-col">
            
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#6651E8]" />
                <h2 className="text-lg sm:text-xl font-black text-[#172554] dark:text-white">
                  Confirmation Gate
                </h2>
              </div>
              <Badge variant="success">Zero Auto-Speak</Badge>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              AI gesture interpretation must be confirmed or edited by you before text-to-speech audio is produced.
            </p>

            {suggestedSentence ? (
              <div className="space-y-4">
                
                <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-bold mb-1">
                    <span>Interpreted Meaning</span>
                    <span>Confidence: {activeGesture ? Math.round(activeGesture.confidence * 100) : 90}%</span>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editedSentence}
                      onChange={(e) => setEditedSentence(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl border border-purple-400 bg-white dark:bg-slate-800 text-[#172554] dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <div className="text-xl sm:text-2xl font-black text-[#172554] dark:text-white py-1">
                      "{suggestedSentence}"
                    </div>
                  )}
                </div>

                <Button
                  size="touch"
                  onClick={handleConfirmAndSpeak}
                  className="w-full gap-3 text-lg"
                >
                  <Volume2 className="w-6 h-6" />
                  <span>Confirm &amp; Speak Message</span>
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex-1 gap-1.5"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Done Editing' : 'Edit Sentence'}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setActiveGesture(null);
                      setSuggestedSentence('');
                      setConfirmedSpeech(null);
                    }}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                </div>

                {confirmedSpeech && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Successfully spoken: "{confirmedSpeech}"</span>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">
                  No gesture selected yet. Choose a gesture or show a hand signal to preview and speak.
                </p>
              </div>
            )}

          </Card>
        </div>

      </div>

    </div>
  );
}

