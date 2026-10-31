'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading conversation...',
  subMessage = 'Connecting to assistive models',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#6651E8] dark:text-purple-300 flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-lg font-bold text-[#172554] dark:text-white high-contrast:text-yellow-400">
        {message}
      </p>
      {subMessage && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {subMessage}
        </p>
      )}
    </div>
  );
};

export default LoadingState;

