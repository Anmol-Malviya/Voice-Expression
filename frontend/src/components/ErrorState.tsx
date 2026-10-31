'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-rose-900 dark:text-rose-200">
        {title}
      </h3>
      <p className="mt-2 text-sm text-rose-700 dark:text-rose-300 max-w-md">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" size="md" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;

