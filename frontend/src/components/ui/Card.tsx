import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 high-contrast:bg-black high-contrast:border-yellow-400 p-6 shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-navy-900 dark:text-white font-medium text-base focus:border-[#6651E8] focus:ring-4 focus:ring-brand-500/20 high-contrast:border-yellow-400 transition min-h-[48px]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'brand' | 'warning' | 'teal' }> = ({
  children,
  variant = 'brand'
}) => {
  const styles = {
    brand: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200",
    success: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200",
    warning: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200",
    teal: "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-200"
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border", styles[variant])}>
      {children}
    </span>
  );
};

