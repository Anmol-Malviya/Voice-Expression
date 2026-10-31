'use client';

import React from 'react';
import Link from 'next/link';
import { Wifi, Activity, Sparkles, Volume2, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  statusBadge?: string;
  actions?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  backHref,
  statusBadge = 'Live & Ready',
  actions,
}) => {
  const { user } = useAppStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[48px] min-w-[48px] flex items-center justify-center transition"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-white high-contrast:text-yellow-400">
              {title}
            </h1>
            {statusBadge && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {statusBadge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default AppHeader;

