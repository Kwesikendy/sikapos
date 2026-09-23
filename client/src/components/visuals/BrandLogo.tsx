import React from 'react';
import { cn } from '../../lib/utils';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  size = 'md',
  showSubtitle = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {/* SikaPOS Geometric Akoma Emblem */}
      <div
        className={cn(
          'rounded-xl bg-[#0D5C3A] flex items-center justify-center text-white shadow-xs shrink-0',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-emerald-200"
        >
          <path d="M12 2L3 7v9l9 6 9-6V7l-9-5z" fill="#0D5C3A" />
          <path d="M12 6v12M7 9l5 3 5-3" stroke="#D97706" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <span
          className={cn(
            'font-bold tracking-tight text-slate-900 leading-none',
            titleSizes[size]
          )}
        >
          SikaPOS
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
            Akoma Commerce Cloud
          </span>
        )}
      </div>
    </div>
  );
};
