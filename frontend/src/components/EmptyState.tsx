'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './ui/Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4 high-contrast:bg-yellow-400 high-contrast:text-black">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-[#172554] dark:text-white high-contrast:text-yellow-400">
        {title}
      </h3>
      <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} size="md">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;

