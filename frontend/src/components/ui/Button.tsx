import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'touch';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-extrabold rounded-2xl transition-all focus:outline-none focus:ring-4 focus:ring-brand-500/30 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    const variants = {
      primary: "bg-[#6651E8] hover:bg-[#533ed4] text-white shadow-md high-contrast:bg-yellow-400 high-contrast:text-black",
      secondary: "bg-teal-700 hover:bg-teal-800 text-white shadow-sm high-contrast:bg-cyan-400 high-contrast:text-black",
      outline: "border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-navy-900 dark:text-white high-contrast:border-yellow-400",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
      ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-navy-900 dark:text-white"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs min-h-[38px]",
      md: "px-5 py-3 text-sm min-h-[48px]",
      lg: "px-6 py-4 text-base min-h-[56px]",
      touch: "px-8 py-5 text-lg min-h-[64px]"
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

