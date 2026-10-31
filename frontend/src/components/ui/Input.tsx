import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#172554] dark:text-white font-medium text-base focus:border-[#6651E8] focus:ring-4 focus:ring-brand-500/20 high-contrast:border-yellow-400 transition min-h-[48px]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export default Input;

