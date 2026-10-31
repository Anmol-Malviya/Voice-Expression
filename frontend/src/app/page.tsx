'use client';

import React from 'react';
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
  HeartHandshake
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const handleTestSpeech = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs mb-6 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Manthan 2.0 &bull; Problem Statement 16 Baseline</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400 tracking-tight leading-tight"
            >
              Giving Voice to Every Expression.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 high-contrast:text-white leading-relaxed"
            >
              An accessible live conversation assistant for people with speech impairments. 
              Fuses partner speech, camera gestures, and AI suggestions with strict user agency.
            </motion.p>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/conversation/new">
                <Button size="touch" className="w-full sm:w-auto gap-3">
                  <MessageSquare className="w-6 h-6" />
                  <span>Start Live Conversation</span>
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" size="touch" className="w-full sm:w-auto">
                  <span>Open Dashboard</span>
                </Button>
              </Link>
            </div>

            {/* Instant Audio Preview */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 inline-flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Test audio synthesis:
              </span>
              <button
                onClick={() => handleTestSpeech("Hello! Welcome to Voice Expression.")}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-[#6651E8] dark:text-purple-300 font-bold border hover:border-purple-500 shadow-sm flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>"Hello! Welcome"</span>
              </button>
              <button
                onClick={() => handleTestSpeech("I need assistance, please wait.")}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-[#6651E8] dark:text-purple-300 font-bold border hover:border-purple-500 shadow-sm flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4" />
                <span>"I need assistance"</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Pillar Cards */}
      <section className="py-16 bg-white dark:bg-slate-900 high-contrast:bg-black border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#172554] dark:text-white high-contrast:text-yellow-400">
              Designed for Natural, Autonomous Communication
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
              Built around strict user confirmation, zero unconfirmed speech, and zero persistent video storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172554] dark:text-white mb-2">Partner Speech-to-Text</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-grow">
                Transcribes what conversation partners say in real time with partial and final committed sentence states.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>ElevenLabs Scribe &amp; Web Speech</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172554] dark:text-white mb-2">Multimodal Vision</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-grow">
                Extracts hand landmarks, lip movement, and head cues directly on-device. Zero video is saved to disk.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>MediaPipe Tasks Vision</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172554] dark:text-white mb-2">Contextual AI Ranking</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-grow">
                Fuses audio and visual cues to propose 2-4 candidate replies with confidence and clarification paths.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict Confirmation Gate</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-4">
                <Accessibility className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#172554] dark:text-white mb-2">Accessible by Design</h3>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed flex-grow">
                Large typography, high-contrast mode, single-switch keyboard navigation, and instant quick phrases.
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>WCAG AAA Compliant</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Quick Phrases Demo Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] dark:text-white mb-4">
            Instant 1-Click Quick Phrases
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto text-sm">
            Speak urgent or everyday requests instantly without typing:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[
              "I need help.",
              "Please wait.",
              "I need water.",
              "I am not feeling well.",
              "Thank you.",
              "Please repeat.",
              "Yes.",
              "No.",
              "I want to go home.",
            ].map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleTestSpeech(phrase)}
                className="p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-[#6651E8] bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-bold text-sm sm:text-base text-left flex items-center justify-between group transition shadow-sm"
              >
                <span>{phrase}</span>
                <Volume2 className="w-4 h-4 text-slate-400 group-hover:text-[#6651E8] transition flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

