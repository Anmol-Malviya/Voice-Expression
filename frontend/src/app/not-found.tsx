'use client';

import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 high-contrast:bg-black high-contrast:border-yellow-400">
        <div className="w-16 h-16 mx-auto rounded-full bg-brand-50 dark:bg-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 high-contrast:text-yellow-400">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white high-contrast:text-white tracking-tight">
            404 — Page Not Found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 high-contrast:text-white leading-relaxed">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2">
              <Home className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Landing Page</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
