'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  Mic,
  Video,
  Volume2,
  ArrowRight,
  CheckCircle2,
  Accessibility,
  HeartHandshake,
  ShieldCheck,
  Globe,
  Sliders,
  Check,
  Eye,
  Activity,
  Layers,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'express' | 'understand' | 'communicate'>('express');
  const [demoSpokenText, setDemoSpokenText] = useState<string | null>(null);

  const handleTestSpeech = (text: string) => {
    setDemoSpokenText(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setDemoSpokenText(null), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32 bg-gradient-to-b from-purple-50/50 via-white to-transparent dark:from-slate-900/40 dark:via-slate-900 dark:to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-extrabold text-xs mb-6 high-contrast:bg-yellow-400 high-contrast:text-black shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#6651E8]" />
              <span>AI Manthan 2.0 &bull; Problem Statement 16 Assistive Platform</span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400 tracking-tight leading-[1.15]"
            >
              Every Voice Deserves to Be Heard.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 high-contrast:text-white leading-relaxed max-w-3xl mx-auto"
            >
              An accessible live conversation assistant for people with speech impairments.
              Fuses partner speech, camera gestures, and AI suggestions with strict user agency.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="touch" className="w-full sm:w-auto gap-3 text-lg font-black shadow-lg">
                  <MessageSquare className="w-6 h-6" />
                  <span>Start Communicating</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>

              <a href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="touch" className="w-full sm:w-auto text-lg font-black">
                  <span>Explore Features</span>
                </Button>
              </a>
            </motion.div>

            {/* Audio Synthesis Demonstration Bar */}
            <div className="mt-10 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm inline-flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#6651E8]" />
                <span>Hear Assistive Voice Preview:</span>
              </span>
              <button
                onClick={() => handleTestSpeech("Hello! Good to see you today.")}
                className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-slate-700 text-[#6651E8] dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition flex items-center gap-2 min-h-[44px]"
              >
                <span>"Hello! Good to see you"</span>
              </button>
              <button
                onClick={() => handleTestSpeech("Yes, please give me a moment to respond.")}
                className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-slate-700 text-[#6651E8] dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition flex items-center gap-2 min-h-[44px]"
              >
                <span>"Please give me a moment"</span>
              </button>
              {demoSpokenText && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                  Speaking now...
                </span>
              )}
            </div>

            {/* Product Preview Interactive Simulation Card */}
            <div className="mt-14 max-w-4xl mx-auto rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl high-contrast:bg-black high-contrast:border-yellow-400 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Live Assistant Simulation
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Strict Confirmation Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side: Incoming Partner Speech */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Transcribed Partner Speech</span>
                    </span>
                    <span className="text-[11px] text-slate-400">11:15 AM</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                    "Hey Alex! Would you like to sit outside on the patio for lunch?"
                  </p>
                </div>

                {/* Right side: AI Candidate Ranked Responses */}
                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#6651E8] dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Proposed Replies (Tap to Speak)</span>
                    </span>
                    <span className="text-[11px] font-bold text-purple-600">Strict Gate</span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleTestSpeech("Yes, that sounds wonderful! Let's go outside.")}
                      className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-700 hover:border-[#6651E8] transition font-bold text-sm text-[#172554] dark:text-white flex items-center justify-between group"
                    >
                      <span>1. "Yes, that sounds wonderful! Let's go outside."</span>
                      <Volume2 className="w-4 h-4 text-purple-600 opacity-60 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => handleTestSpeech("I prefer to stay inside today, thank you.")}
                      className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#6651E8] transition font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between group"
                    >
                      <span>2. "I prefer to stay inside today, thank you."</span>
                      <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#6651E8] dark:text-purple-400">
              Complete Assistive Suite
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
              Engineered for Independence &amp; Speed
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Combining on-device visual cue processing with multi-tiered speech synthesis and privacy guarantees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: TTS */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#6651E8] dark:text-purple-300 flex items-center justify-center mb-6">
                <Volume2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                Text-to-Speech
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Natural speech synthesis with browser-native and neural options. Adjustable speech rates and volume optimized for noisy rooms.
              </p>
            </Card>

            {/* Feature 2: STT */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-6">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                Speech-to-Text
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Live transcription of incoming partner speech ensures the conversation context is captured clearly on your screen.
              </p>
            </Card>

            {/* Feature 3: AI Assistant */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                AI Conversation Assistant
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Contextual models rank 2–4 natural reply candidates based on the dialogue flow, ready for one-tap confirmation.
              </p>
            </Card>

            {/* Feature 4: Gesture Recognition */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-6">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                Gesture Recognition
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Captures hand cues (thumbs up, open palm, wave) and head nods to fuse intentional non-verbal signals into reply proposals.
              </p>
            </Card>

            {/* Feature 5: Multilingual */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                Multilingual Communication
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Seamless support for English, Hindi, Hinglish, Spanish, French, and German for diverse cultural contexts.
              </p>
            </Card>

            {/* Feature 6: Accessible Interface */}
            <Card className="p-8 hover:border-[#6651E8] transition">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-6">
                <Accessibility className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[#172554] dark:text-white mb-2">
                Accessible Interface (WCAG AAA)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                High-contrast palettes, text scaling, keyboard tab order, single-switch navigation, and large touch targets exceeding 52px.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#6651E8] dark:text-purple-400">
              Simple 3-Step Flow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
              How VoiceExpression Works
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Designed around patient autonomy: you are always in control of what is spoken.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Express */}
            <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-[#6651E8] text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md">
                1
              </div>
              <h3 className="text-2xl font-black text-[#172554] dark:text-white mb-3">
                Express
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Use intuitive gestures, quick phrase shortcuts, single-switch taps, or direct typing to communicate your intent effortlessly.
              </p>
            </div>

            {/* Step 2: Understand */}
            <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md">
                2
              </div>
              <h3 className="text-2xl font-black text-[#172554] dark:text-white mb-3">
                Understand
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                The multimodal assistant listens to the conversation partner and combines your cues to suggest rank-ordered, highly relevant sentences.
              </p>
            </div>

            {/* Step 3: Communicate */}
            <div className="relative p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-teal-600 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-md">
                3
              </div>
              <h3 className="text-2xl font-black text-[#172554] dark:text-white mb-3">
                Communicate
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                With a single tap on the strict confirmation gate, your message is spoken aloud in clear, natural synthesized speech.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About the Project Section */}
      <section id="about" className="py-20 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
              <HeartHandshake className="w-8 h-8 text-[#6651E8]" />
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-white">
                  About AI Manthan 2.0 (Problem Statement 16)
                </h3>
                <p className="text-sm text-slate-500">
                  Multimodal Live Conversation Assistant for People with Speech Impairments
                </p>
              </div>
            </div>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Individuals living with <strong>Amyotrophic Lateral Sclerosis (ALS), Cerebral Palsy, Parkinson’s Disease, Stroke, or Laryngectomy</strong> frequently face communication barriers when using conventional voice-only speech recognition tools. VoiceExpression bridges this gap by fusing partner speech audio, vision landmarks, and accessible single-tap interfaces.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#6651E8] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-200">
                    Strict Human Agency
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                    The AI assistant never speaks on its own. Every sentence requires explicit user confirmation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-teal-900 dark:text-teal-200">
                    Privacy By Design
                  </h4>
                  <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
                    Zero raw media retention. Camera video and audio streams are processed in ephemeral memory.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-400">
                Ready to experience the assistive workspace?
              </span>
              <Link href="/dashboard">
                <Button size="md" className="gap-2">
                  <span>Enter Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
