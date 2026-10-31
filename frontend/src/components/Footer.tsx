import React from 'react';
import { HeartHandshake, Keyboard, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-[#6651E8] flex-shrink-0" />
          <span>
            <strong>AI Manthan 2.0 (Problem Statement 16)</strong>: Multimodal Assistive Technology.
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg font-medium">
            <Keyboard className="w-4 h-4" />
            <span>Single-Switch &amp; Keyboard Accessible</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Privacy Guard: Zero video/audio stored</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

