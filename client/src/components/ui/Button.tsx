import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas disabled:opacity-50 disabled:pointer-events-none select-none active-depress cursor-pointer rounded-btn';

    const variants = {
      primary:
        'bg-[#0D5C3A] text-white hover:bg-[#09432A] active:bg-[#062F1D] focus-visible:ring-[#0D5C3A] shadow-[0_2px_10px_rgba(13,92,58,0.2)] hover:shadow-[0_4px_14px_rgba(13,92,58,0.3)]',
      secondary:
        'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-400 shadow-sm hover:shadow-md',
      outline:
        'bg-transparent border-[1.5px] border-slate-200 text-slate-700 hover:border-[#0D5C3A] hover:bg-[#0D5C3A]/5 active:bg-[#0D5C3A]/10 focus-visible:ring-[#0D5C3A]',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
      danger:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus-visible:ring-[#DC2626] shadow-[0_2px_10px_rgba(220,38,38,0.2)] hover:shadow-[0_4px_14px_rgba(220,38,38,0.3)]',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs gap-1.5',
      md: 'h-12 px-5 text-sm gap-2 min-h-[48px]',
      lg: 'h-[52px] px-6 text-base gap-2.5 min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
