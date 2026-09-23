import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'online' | 'offline' | 'primary' | 'neutral' | 'amber' | 'blue';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  pulse = false,
  children,
  ...props
}) => {
  const variants = {
    online: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    offline: 'bg-amber-50 text-amber-900 border-amber-200',
    primary: 'bg-[#E8F5EE] text-[#0D5C3A] border-[#8ad2a7]',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide select-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      )}
      {children}
    </span>
  );
};
