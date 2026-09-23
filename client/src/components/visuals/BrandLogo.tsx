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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {/* SikaPOS Geometric Akoma / Modern Retail Terminal Emblem */}
      <div
        className={cn(
          'rounded-xl bg-[#00A859] flex items-center justify-center text-white shadow-sm shrink-0 transition-transform hover:scale-105',
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
          className="w-5 h-5 text-white"
        >
          <rect x="3" y="4" width="18" height="16" rx="3" fill="#00A859" stroke="white" strokeWidth="2" />
          <path d="M7 8h10M7 12h6M7 16h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="15" r="1.5" fill="#FDE047" stroke="#FDE047" />
        </svg>
      </div>

      <div className="flex flex-col text-left">
        <span
          className={cn(
            'font-extrabold tracking-tight text-slate-900 leading-none font-sans',
            titleSizes[size]
          )}
        >
          Sika<span className="text-[#00A859]">POS</span>
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-bold tracking-wider text-slate-500 mt-1 uppercase">
            Akoma Commerce Cloud
          </span>
        )}
      </div>
    </div>
  );
};
